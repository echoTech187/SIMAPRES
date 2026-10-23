'use client';

import React, { useState, useEffect } from 'react';
import {
  getMasterVehiclesAction,
  createMasterVehicleAction,
  updateMasterVehicleAction,
  deleteMasterVehicleAction,
} from '@/app/actions/master.actions';
import { MasterTabProps, DEFAULT_FORM_DATA } from './types';
import MasterTabShell from './MasterTabShell';
import Select2CustomDropdown from '@/components/ui/Select2CustomDropdown';

export default function TabArmada({ lookups, showToast, onRefreshDropdowns }: MasterTabProps) {
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { vehicleTypesList, vehicleStatusesList } = lookups;

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getMasterVehiclesAction();
      if (res?.success && res.data) setDataList(res.data);
    } catch (err) { console.warn('Gagal memuat Armada:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (formData: any) => {
    if (!formData.nomor_lambung?.trim() || !formData.nama_armada?.trim() || !formData.jenis_kendaraan?.trim() || !formData.status_operasional?.trim()) {
      alert('Nomor Lambung, Nama Armada, Jenis Kendaraan, dan Status Operasional wajib diisi!');
      return false;
    }
    return await createMasterVehicleAction(formData);
  };

  const handleUpdate = async (id: number | string, formData: any) =>
    await updateMasterVehicleAction(Number(id), formData);

  const handleDelete = async (id: number | string) =>
    await deleteMasterVehicleAction(Number(id));

  const getEditFormData = (item: any) => ({
    ...DEFAULT_FORM_DATA,
    nomor_lambung: item.nomor_lambung ?? '',
    nama_armada: item.nama_armada ?? '',
    jenis_kendaraan: item.jenis_kendaraan ?? '',
    plat_nomor_polisi: item.plat_nomor_polisi ?? '',
    status_operasional: item.status_operasional ?? '',
    driver_officer_nrp: item.driver_officer_nrp ?? '',
    current_lat: item.current_lat != null ? Number(item.current_lat) : 0,
    current_lng: item.current_lng != null ? Number(item.current_lng) : 0,
  });

  const statusColor = (s: string) => {
    if (s === 'SIAGA') return { bg: '#ECFDF5', color: '#059669' };
    if (s === 'PATROLI') return { bg: '#EFF6FF', color: '#2563EB' };
    if (s === 'DARURAT') return { bg: '#FEF2F2', color: '#DC2626' };
    return { bg: '#F1F5F9', color: '#64748B' };
  };

  return (
    <MasterTabShell
      config={{
        title: 'Master Armada Operasional & Ranmor Patroli',
        desc: 'Database armada kendaraan dinas patroli (Mobil Patroli R4, Motor Trail Perintis R2, Ranmor Opsnal) dengan QR Token fisik.',
        addBtn: 'Tambah Armada Patroli',
        icon: '🚓',
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
      getDeleteLabel={(item) => item.nama_armada || item.nomor_lambung}
      showActiveFilter={false}
      extraSearchFields={(item) => [item.nomor_lambung, item.nama_armada, item.plat_nomor_polisi, item.jenis_kendaraan, item.driver_officer_nrp]}
      modalWidth="600px"
      tableColumns={[
        { header: 'NO. LAMBUNG', render: (item) => <code className="master-code-badge">{item.nomor_lambung}</code> },
        { header: 'NAMA ARMADA', render: (item) => <span className="master-text-primary">{item.nama_armada}</span> },
        { header: 'JENIS & PLAT POLISI', render: (item) => (
          <div>
            <span className="master-tag-blue" style={{ marginRight: '6px' }}>{item.jenis_kendaraan}</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0F172A' }}>{item.plat_nomor_polisi}</span>
          </div>
        )},
        { header: 'STATUS OPERASIONAL', render: (item) => {
          const { bg, color } = statusColor(item.status_operasional);
          return <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '12px', background: bg, color, border: '1px solid currentColor' }}>● {item.status_operasional}</span>;
        }},
        { header: 'NRP PENGEMUDI', render: (item) => <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#475569' }}>{item.driver_officer_nrp}</span> },
        { header: 'QR TOKEN', render: (item) => <code style={{ fontSize: '11px', color: '#6366F1', background: '#EEF2FF', padding: '2px 6px', borderRadius: '4px' }}>{item.qr_token}</code> },
      ]}
      renderFormFields={(formData, setFormData) => (
        <>
          <div className="master-form-group">
            <label className="master-form-label">Nomor Lambung Kendaraan <span className="required">*</span></label>
            <input
              type="text"
              required
              className="master-form-input"
              style={{ fontFamily: 'monospace', fontWeight: 700 }}
              placeholder="Contoh: R4-SAMAPTA-01"
              value={formData.nomor_lambung}
              onChange={(e) => setFormData({ ...formData, nomor_lambung: e.target.value })}
            />
          </div>
          <div className="master-form-group">
            <label className="master-form-label">Nama Armada Patroli <span className="required">*</span></label>
            <input
              type="text"
              required
              className="master-form-input"
              placeholder="Contoh: Mobil Patroli Samapta Presisi R4-01"
              value={formData.nama_armada}
              onChange={(e) => setFormData({ ...formData, nama_armada: e.target.value })}
            />
          </div>
          <div className="master-form-grid-2">
            <div>
              <label className="master-form-label">Jenis Kendaraan <span className="required">*</span></label>
              <Select2CustomDropdown
                required
                value={formData.jenis_kendaraan || ''}
                onChange={(val) => setFormData({ ...formData, jenis_kendaraan: val })}
                options={vehicleTypesList.map((vt) => ({ value: vt.key, label: vt.label }))}
                placeholder="-- Pilih Jenis Kendaraan --"
                title="Pilih Jenis Kendaraan"
              />
            </div>
            <div>
              <label className="master-form-label">Plat Nomor Dinas Polisi</label>
              <input
                type="text"
                className="master-form-input"
                style={{ fontFamily: 'monospace' }}
                placeholder="Contoh: 1001-VII"
                value={formData.plat_nomor_polisi}
                onChange={(e) => setFormData({ ...formData, plat_nomor_polisi: e.target.value })}
              />
            </div>
          </div>
          <div className="master-form-grid-2">
            <div>
              <label className="master-form-label">Status Kesiapsiagaan <span className="required">*</span></label>
              <Select2CustomDropdown
                required
                value={formData.status_operasional || ''}
                onChange={(val) => setFormData({ ...formData, status_operasional: val })}
                options={vehicleStatusesList.map((vs) => ({ value: vs.key, label: vs.label }))}
                placeholder="-- Pilih Status Operasional --"
                title="Pilih Status Kesiapsiagaan"
              />
            </div>
            <div>
              <label className="master-form-label">NRP Pengemudi / Unit</label>
              <input
                type="text"
                className="master-form-input"
                placeholder="Contoh: 95020123"
                value={formData.driver_officer_nrp}
                onChange={(e) => setFormData({ ...formData, driver_officer_nrp: e.target.value })}
              />
            </div>
          </div>
        </>
      )}
    />
  );
}

