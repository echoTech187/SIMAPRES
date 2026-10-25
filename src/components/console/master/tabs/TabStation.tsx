'use client';

import React, { useState, useEffect } from 'react';
import {
  getPoliceStationsMasterAction,
  getMasterStationLevelsAction,
  createPoliceStationMasterAction,
  updatePoliceStationMasterAction,
  deletePoliceStationMasterAction,
} from '@/app/actions/master.actions';
import AddressLocationPicker from '@/components/common/AddressLocationPicker';
import { MasterTabProps, DEFAULT_FORM_DATA } from './types';
import MasterTabShell from './MasterTabShell';
import Select2CustomDropdown from '@/components/ui/Select2CustomDropdown';
import CodeIdentifierField, { formatCodeIdentifier } from '@/components/ui/CodeIdentifierField';

export default function TabStation({ lookups, showToast, onRefreshDropdowns }: MasterTabProps) {
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { stationLevelsList } = lookups;

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getPoliceStationsMasterAction();
      if (res?.success && res.data) setDataList(res.data);
    } catch (err) { console.warn('Gagal memuat Station:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (formData: any) => {
    if (!formData.station_code?.trim() || !formData.station_name?.trim() || !formData.station_level?.trim() || !formData.address?.trim()) {
      alert('Kode Mako, Nama Mako, Tingkat Hierarki, dan Alamat Mako wajib diisi!');
      return false;
    }
    return await createPoliceStationMasterAction(formData);
  };

  const handleUpdate = async (id: number | string, formData: any) =>
    await updatePoliceStationMasterAction(Number(id), formData);

  const handleDelete = async (id: number | string) =>
    await deletePoliceStationMasterAction(Number(id));

  const getEditFormData = (item: any) => ({
    ...DEFAULT_FORM_DATA,
    station_code: item.station_code ?? '',
    station_name: item.station_name ?? '',
    station_level: item.station_level ?? '',
    address: item.address ?? '',
    office_lat: item.office_lat != null ? Number(item.office_lat) : 0,
    office_lng: item.office_lng != null ? Number(item.office_lng) : 0,
    geofence_radius_meters: item.geofence_radius_meters != null ? Number(item.geofence_radius_meters) : 0,
    phone_piket: item.phone_piket ?? '',
    phone_kapolsek: item.phone_kapolsek ?? '',
  });

  return (
    <MasterTabShell
      config={{
        title: 'Master Kantor Polisi & Posko (Mako)',
        desc: 'Pangkalan data Markas Komando (Polda, Polres, Polsek, Pospol) lengkap dengan koordinat GPS, radius geofence, dan nomor WhatsApp piket untuk disposisi otomatis.',
        addBtn: 'Tambah Kantor Polisi',
        icon: '🏢',
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
      getDeleteLabel={(item) => item.station_name || item.station_code}
      showActiveFilter={false}
      extraSearchFields={(item) => [item.station_code, item.station_name, item.station_level, item.address, item.phone_piket, item.phone_kapolsek]}
      modalWidth="720px"
      tableColumns={[
        { header: 'NAMA / LABEL', render: (item) => <span className="master-text-primary">{item.station_name}</span> },
        { header: 'TINGKAT & ALAMAT', render: (item) => (
          <div>
            <span className="master-tag-blue" style={{ marginRight: '6px' }}>{item.station_level}</span>
            <span className="master-text-muted">{item.address}</span>
          </div>
        )},
        { header: 'KONTAK & WA PIKET', render: (item) => (
          <div>
            {item.phone_piket ? (
              <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                📱 WA Piket: {item.phone_piket}
              </div>
            ) : (
              <span className="master-text-muted" style={{ fontSize: '11px' }}>Belum ada No. WA Piket</span>
            )}
            {item.phone_kapolsek && (
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                📞 Pimpinan: {item.phone_kapolsek}
              </div>
            )}
          </div>
        )},
        { header: 'KOORDINAT & GEOFENCE', render: (item) => (
          <div style={{ fontFamily: 'monospace', fontSize: '11.5px', color: '#475569' }}>
            <div>📍 {Number(item.office_lat).toFixed(4)}, {Number(item.office_lng).toFixed(4)}</div>
            <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>Geofence: {item.geofence_radius_meters}m</div>
          </div>
        )},
      ]}
      renderFormFields={(formData, setFormData) => {
        const handleStationNameChange = (val: string) => {
          const prevAuto = formatCodeIdentifier(formData.station_name || '');
          const shouldAutoUpdate = !formData.station_code || formData.station_code === prevAuto;
          setFormData((prev: any) => ({
            ...prev,
            station_name: val,
            ...(shouldAutoUpdate ? { station_code: formatCodeIdentifier(val) } : {}),
          }));
        };

        return (
          <>
            <div className="master-form-group">
              <label className="master-form-label">Nama Markas Komando <span className="required">*</span></label>
              <input
                type="text"
                required
                className="master-form-input"
                placeholder="Contoh: Polsek Metro Kebayoran Baru"
                value={formData.station_name}
                onChange={(e) => handleStationNameChange(e.target.value)}
              />
            </div>
            <CodeIdentifierField
              label="Kode Mako"
              value={formData.station_code}
              onChange={(val) => setFormData((prev: any) => ({ ...prev, station_code: val }))}
              sourceValue={formData.station_name || ''}
              placeholder="Contoh: POLSEK_KBY_BARU"
              helpText="Otomatis terisi saat mengetik nama mako, atau klik Generate Otomatis"
            />
            <div className="master-form-grid-2">
              <div>
                <label className="master-form-label">Tingkat Hierarki Mako <span className="required">*</span></label>
                <Select2CustomDropdown
                  required
                  value={formData.station_level || ''}
                  onChange={(val) => setFormData({ ...formData, station_level: val })}
                  options={stationLevelsList.map((sl) => ({
                    value: sl.key,
                    label: `${sl.label} (${sl.key})`,
                  }))}
                  placeholder="-- Pilih Tingkat Hierarki --"
                  title="Pilih Tingkat Hierarki Mako"
                />
              </div>
              <div>
                <label className="master-form-label">Radius Geofence (Meter)</label>
                <input
                  type="number"
                  min="10"
                  className="master-form-input"
                  placeholder="Contoh: 500"
                  value={formData.geofence_radius_meters || ''}
                  onChange={(e) => setFormData({ ...formData, geofence_radius_meters: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="master-form-grid-2">
              <div>
                <label className="master-form-label">No. WhatsApp Piket SPKT (Disposisi Otomatis)</label>
                <input
                  type="text"
                  className="master-form-input"
                  placeholder="Contoh: 08123456789 atau 0285-xxxx"
                  value={formData.phone_piket || ''}
                  onChange={(e) => setFormData({ ...formData, phone_piket: e.target.value })}
                />
                <span className="master-form-help" style={{ fontSize: '10.5px', color: '#64748b' }}>
                  Target pengiriman WA otomatis saat ada tiket Darurat/Sedang di wilayah Polsek ini.
                </span>
              </div>
              <div>
                <label className="master-form-label">No. Kontak Pimpinan / Kapolsek</label>
                <input
                  type="text"
                  className="master-form-input"
                  placeholder="Contoh: 08129876543"
                  value={formData.phone_kapolsek || ''}
                  onChange={(e) => setFormData({ ...formData, phone_kapolsek: e.target.value })}
                />
                <span className="master-form-help" style={{ fontSize: '10.5px', color: '#64748b' }}>
                  Kontak darurat pimpinan jika alarm eskalasi Mako berbunyi.
                </span>
              </div>
            </div>
          <AddressLocationPicker
            label="Alamat Lengkap Mako"
            required={true}
            placeholder="Ketikan Alamat Mako"
            value={formData.address || ''}
            lat={formData.office_lat || 0}
            lng={formData.office_lng || 0}
            onChangeAddress={(newAddr) => setFormData((prev: any) => ({ ...prev, address: newAddr }))}
            onChangeCoords={(newLat, newLng) => setFormData((prev: any) => ({ ...prev, office_lat: newLat, office_lng: newLng }))}
            mapHeight="230px"
          />
          </>
        );
      }}
    />
  );
}

