'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getRegisteredUnitsAction,
  registerNewUnitAction,
  deleteRegisteredUnitAction,
  getMasterDropdownsAction,
} from '@/app/actions/auth.actions';
import { MasterTabProps, DEFAULT_FORM_DATA } from './types';
import MasterTabShell from './MasterTabShell';
import Select2CustomDropdown from '@/components/ui/Select2CustomDropdown';
import NameInitialAvatar from '@/components/ui/NameInitialAvatar';

interface TabUnitPersonelProps extends Partial<MasterTabProps> {
  initialUnits?: any[];
  initialMasterItems?: any[];
  showToast: (msg: string) => void;
  onRefreshDropdowns?: () => void;
  onOpenQrModal?: (nrp: string, unitId: string) => void;
}

export default function TabUnitPersonel({
  initialUnits,
  initialMasterItems,
  showToast,
  onRefreshDropdowns,
  onOpenQrModal,
}: TabUnitPersonelProps) {
  const [units, setUnits] = useState<any[]>(initialUnits || []);
  const [masterItems, setMasterItems] = useState<any[]>(initialMasterItems || []);
  const [loading, setLoading] = useState(!initialUnits);

  // Filter states
  const [filterSatuan, setFilterSatuan] = useState('all');
  const [filterMako, setFilterMako] = useState('all');
  const [filterRole, setFilterRole] = useState('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const [resUnits, resMasters] = await Promise.all([
        getRegisteredUnitsAction(),
        getMasterDropdownsAction(),
      ]);
      if (resUnits?.success && resUnits.data) {
        setUnits(resUnits.data);
      }
      if (resMasters?.success && resMasters.data) {
        setMasterItems(resMasters.data);
      }
    } catch (err) {
      console.warn('Gagal memuat data personel & unit:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialUnits || initialUnits.length === 0) {
      loadData();
    } else {
      setUnits(initialUnits);
    }
  }, [initialUnits]);

  useEffect(() => {
    if (initialMasterItems && initialMasterItems.length > 0) {
      setMasterItems(initialMasterItems);
    }
  }, [initialMasterItems]);

  const getRoleBadgeInfo = (roleStr?: string) => {
    const r = (roleStr || 'PERSONIL').toUpperCase();
    if (r === 'PAWAS') {
      return { className: 'badge-role role-pawas', icon: '👑', label: 'PAWAS' };
    }
    if (r === 'OPERATOR_110' || r.includes('OPERATOR')) {
      return { className: 'badge-role role-operator', icon: '🎧', label: 'OPERATOR 110' };
    }
    if (r === 'SUPERADMIN') {
      return { className: 'badge-role role-superadmin', icon: '⚡', label: 'SUPERADMIN' };
    }
    return { className: 'badge-role role-personil', icon: '👮', label: 'PERSONIL' };
  };

  const getSatuanBadgeClass = (uid: string) => {
    const low = (uid || '').toLowerCase();
    if (low.includes('reskrim')) return 'badge-satuan satuan-reskrim';
    if (low.includes('intel')) return 'badge-satuan satuan-intel';
    if (low.includes('lantas')) return 'badge-satuan satuan-lantas';
    if (low.includes('binmas')) return 'badge-satuan satuan-binmas';
    if (low.includes('komando') || low.includes('pawas')) return 'badge-satuan satuan-komando';
    return 'badge-satuan satuan-samapta';
  };

  const handleCreate = async (formData: any) => {
    if (!formData.nrp?.trim() || !formData.nama?.trim()) {
      alert('NRP dan Nama Petugas wajib diisi!');
      return false;
    }
    const res = await registerNewUnitAction({
      nrp: formData.nrp.trim(),
      nama: formData.nama.trim(),
      pangkat: formData.pangkat || '',
      role: formData.role || 'PERSONIL',
      unitId: formData.unitId || '',
      satuanNama: formData.satuanNama || '',
      kelompokRegu: formData.kelompokRegu || '',
      stationId: formData.stationId ? Number(formData.stationId) : null,
      deviceID: formData.deviceId?.trim() || undefined,
      liveLat: 0,
      liveLng: 0,
    });
    if (res?.success) {
      await loadData();
      if (onRefreshDropdowns) onRefreshDropdowns();
    }
    return res;
  };

  const handleUpdate = async (id: number | string, formData: any) => {
    const res = await registerNewUnitAction({
      editId: String(id),
      oldNrp: formData.oldNrp || formData.nrp,
      nrp: formData.nrp.trim(),
      nama: formData.nama.trim(),
      pangkat: formData.pangkat || '',
      role: formData.role || 'PERSONIL',
      unitId: formData.unitId || '',
      satuanNama: formData.satuanNama || '',
      kelompokRegu: formData.kelompokRegu || '',
      stationId: formData.stationId ? Number(formData.stationId) : null,
      password: formData.password?.trim() ? formData.password.trim() : undefined,
      deviceID: formData.deviceId || undefined,
      liveLat: 0,
      liveLng: 0,
    });
    if (res?.success) {
      await loadData();
      if (onRefreshDropdowns) onRefreshDropdowns();
    }
    return res;
  };

  const handleDelete = async (id: number | string) => {
    const target = units.find((u) => u.id === id || String(u.id) === String(id) || u.nrp === id);
    const targetId = target?.id || target?.nrp || id;
    const res = await deleteRegisteredUnitAction(targetId);
    if (res?.success) {
      await loadData();
      if (onRefreshDropdowns) onRefreshDropdowns();
    }
    return res;
  };

  const getEditFormData = (u: any) => ({
    ...DEFAULT_FORM_DATA,
    id: u.id,
    oldNrp: u.nrp,
    nrp: u.nrp ?? '',
    nama: u.nama ?? '',
    pangkat: u.pangkat ?? '',
    role: u.role ?? 'PERSONIL',
    unitId: u.unitId ?? '',
    satuanNama: u.satuanNama ?? '',
    kelompokRegu: u.kelompokRegu ?? '',
    stationId: u.stationId ? String(u.stationId) : '',
    password: '',
    deviceId: u.deviceID || '',
  });

  // Filter berdasarkan Satuan, Mako, Role
  const filteredUnits = units.filter((u) => {
    const matchSatuan = filterSatuan === 'all' || u.unitId?.toLowerCase() === filterSatuan.toLowerCase();
    const matchRole = filterRole === 'all' || (u.role || 'PERSONIL').toUpperCase() === filterRole.toUpperCase();
    const matchMako = filterMako === 'all' || String(u.stationId) === String(filterMako) || u.stationCode?.toLowerCase() === filterMako.toLowerCase();
    return matchSatuan && matchRole && matchMako;
  });

  return (
    <MasterTabShell
      config={{
        title: 'Database Personel & Satuan Unit Aktif',
        desc: 'Pangkalan data resmi seluruh personel operasional, hak akses komando, dan pengikatan device ID GPS aktif di database SIMOPMAS 110.',
        addBtn: 'Daftarkan Personel Baru',
        icon: '👮',
      }}
      dataList={filteredUnits}
      loading={loading}
      lookups={{
        stationLevelsList: [],
        urgencyLevelsList: [],
        vehicleTypesList: [],
        vehicleStatusesList: [],
        dangerLevelsList: [],
        categoriesList: [],
        unitsList: masterItems.filter((m) => m.tipe === 'satuan'),
        hotspotCategoriesList: [],
      }}
      showToast={showToast}
      onReload={loadData}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      getEditFormData={getEditFormData}
      getDeleteLabel={(u) => `${u.pangkat ? u.pangkat + ' ' : ''}${u.nama} (NRP: ${u.nrp})`}
      extraSearchFields={(u) => [u.nama, u.nrp, u.role, u.satuanNama, u.stationName, u.deviceID, u.kelompokRegu]}
      modalWidth="680px"
      showActiveFilter={false}
      renderExtraFilters={() => (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ minWidth: '150px' }}>
            <Select2CustomDropdown
              value={filterSatuan}
              onChange={(val) => setFilterSatuan(val || 'all')}
              options={[
                { value: 'all', label: 'Semua Satuan' },
                ...masterItems
                  .filter((m) => m.tipe === 'satuan')
                  .map((m) => ({ value: m.code, label: m.label })),
              ]}
              title="Pilih Filter Satuan"
              placeholder="Semua Satuan"
            />
          </div>

          <div style={{ minWidth: '170px' }}>
            <Select2CustomDropdown
              value={filterMako}
              onChange={(val) => setFilterMako(val || 'all')}
              options={[
                { value: 'all', label: 'Semua Mako' },
                ...masterItems
                  .filter((m) => m.tipe === 'station')
                  .map((m) => ({ value: m.numericId || m.code, label: `🏢 ${m.name || m.label}` })),
              ]}
              title="Pilih Filter Kantor Polisi (Mako)"
              placeholder="Semua Mako"
            />
          </div>

          <div style={{ minWidth: '150px' }}>
            <Select2CustomDropdown
              value={filterRole}
              onChange={(val) => setFilterRole(val || 'all')}
              options={[
                { value: 'all', label: 'Semua Role' },
                ...masterItems
                  .filter((m) => m.tipe === 'role')
                  .map((m) => {
                    const icon =
                      m.code === 'PAWAS'
                        ? '👑'
                        : m.code === 'OPERATOR_110' || m.code?.includes('OPERATOR')
                        ? '🎧'
                        : m.code === 'SUPERADMIN'
                        ? '⚡'
                        : '👮';
                    return {
                      value: m.code,
                      label: `${icon} ${m.label}`,
                    };
                  }),
              ]}
              title="Pilih Filter Role"
              placeholder="Semua Role"
            />
          </div>
        </div>
      )}
      tableColumns={[
        {
          header: 'PERSONEL / NRP',
          render: (u: any) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <NameInitialAvatar
                name={u.nama}
                avatarUrl={u.avatarUrl}
                size={34}
                variant="blue"
              />
              <div>
                <div style={{ fontWeight: 800, color: '#0F172A' }}>
                  {u.nama && u.pangkat && u.nama.toLowerCase().startsWith(u.pangkat.toLowerCase())
                    ? u.nama
                    : `${u.pangkat ? u.pangkat + ' ' : ''}${u.nama}`}
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748B' }}>
                  NRP: {u.nrp}
                </div>
              </div>
            </div>
          ),
        },
        {
          header: 'ROLE',
          render: (u: any) => {
            const roleInfo = getRoleBadgeInfo(u.role);
            return (
              <span className={roleInfo.className}>
                <span>{roleInfo.icon}</span> {roleInfo.label}
              </span>
            );
          },
        },
        {
          header: 'UNIT SATUAN',
          render: (u: any) => (
            <div>
              <span className={getSatuanBadgeClass(u.unitId || '')}>{u.satuanNama || u.unitId}</span>
              {u.stationName && (
                <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '3px', fontWeight: 600 }}>
                  🏢 {u.stationName}
                </div>
              )}
            </div>
          ),
        },
        {
          header: 'REGU / BEAT',
          render: (u: any) => <span style={{ fontWeight: 600, color: '#475569' }}>{u.kelompokRegu || '-'}</span>,
        },
        {
          header: 'DEVICE ID HP',
          render: (u: any) => (
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#0284C7',
                background: '#F0F9FF',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid #BAE6FD',
                whiteSpace: 'nowrap',
              }}
            >
              {u.deviceID || 'BELUM TERIKAT'}
            </span>
          ),
        },
        {
          header: 'KONSOL',
          render: (u: any) => (
            <Link
              href={`/personil?nrp=${encodeURIComponent(u.nrp)}`}
              className="action-btn-reg"
              style={{
                background: '#ECFDF5',
                color: '#059669',
                borderColor: '#A7F3D0',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: '6px',
              }}
            >
              🛡️ Buka
            </Link>
          ),
        },
        {
          header: 'STATUS GPS',
          render: () => (
            <span className="badge-status status-aktif">
              <span style={{ fontSize: '9px' }}>●</span> AKTIF
            </span>
          ),
        },
      ]}
      renderFormFields={(formData, setFormData) => {
        const handleUnitChangeInModal = (val: string) => {
          const match = masterItems.find(
            (m) => m.tipe === 'satuan' && (m.code === val || m.item_code === val)
          );
          setFormData({
            ...formData,
            unitId: val,
            satuanNama: match?.label || match?.item_name || val.toUpperCase(),
          });
        };

        return (
          <>
            {/* 1. DATA IDENTITAS PERSONEL */}
            <div className="form-section-divider" style={{ marginTop: 0 }}>
              <div className="form-section-title">
                <span>👤</span> 1. Data Identitas Personel
              </div>
            </div>

            <div className="master-form-grid-2">
              <div>
                <label className="form-label-reg" style={{ marginBottom: '6px' }}>
                  NRP Personel <span className="req">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="form-control-reg font-mono"
                  placeholder="Contoh: 95020123"
                  value={formData.nrp || ''}
                  onChange={(e) => setFormData({ ...formData, nrp: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label-reg" style={{ marginBottom: '6px' }}>
                  Nama Lengkap &amp; Gelar <span className="req">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="form-control-reg"
                  placeholder="Contoh: Bripka Ahmad Subagyo, S.H."
                  value={formData.nama || ''}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group-reg">
              <label className="form-label-reg" style={{ marginBottom: '6px' }}>
                Pangkat Kepolisian <span className="req">*</span>
              </label>
              <Select2CustomDropdown
                required
                value={formData.pangkat || ''}
                onChange={(val) => setFormData({ ...formData, pangkat: val })}
                options={masterItems
                  .filter((m) => m.tipe === 'pangkat')
                  .map((m) => ({ value: m.code || m.label, label: m.label }))}
                placeholder="Pilih Pangkat"
                title="Pilih Pangkat Kepolisian"
                searchable={true}
              />
            </div>

            {/* 2. HAK AKSES & PENUGASAN SATUAN */}
            <div className="form-section-divider">
              <div className="form-section-title">
                <span>🛡️</span> 2. Hak Akses &amp; Penugasan Satuan
              </div>
            </div>

            <div className="master-form-grid-2">
              <div>
                <label className="form-label-reg" style={{ marginBottom: '6px' }}>
                  Role / Hak Akses Sistem <span className="req">*</span>
                </label>
                <Select2CustomDropdown
                  required
                  value={formData.role || ''}
                  onChange={(val) => setFormData({ ...formData, role: val })}
                  options={masterItems
                    .filter((m) => m.tipe === 'role')
                    .map((m) => {
                      const icon =
                        m.code === 'PAWAS'
                          ? '👑'
                          : m.code === 'OPERATOR_110' || m.code?.includes('OPERATOR')
                          ? '🎧'
                          : m.code === 'SUPERADMIN'
                          ? '⚡'
                          : '👮';
                      return {
                        value: m.code,
                        label: `${icon} ${m.label} (${m.code})`,
                      };
                    })}
                  placeholder="Pilih Role"
                  title="Pilih Role / Hak Akses Sistem"
                />
              </div>
              <div>
                <label className="form-label-reg" style={{ marginBottom: '6px' }}>
                  Unit Satuan Operasional <span className="req">*</span>
                </label>
                <Select2CustomDropdown
                  required
                  value={formData.unitId || ''}
                  onChange={(val) => handleUnitChangeInModal(val)}
                  options={masterItems
                    .filter((m) => m.tipe === 'satuan')
                    .map((m) => ({ value: m.code, label: m.label }))}
                  placeholder="Pilih Satuan"
                  title="Pilih Unit Satuan Operasional"
                />
              </div>
            </div>

            <div className="master-form-grid-2">
              <div>
                <label className="form-label-reg" style={{ marginBottom: '6px' }}>
                  Kantor Polisi (Mako) <span className="req">*</span>
                </label>
                <Select2CustomDropdown
                  required
                  value={formData.stationId || ''}
                  onChange={(val) => setFormData({ ...formData, stationId: val })}
                  options={masterItems
                    .filter((m) => m.tipe === 'station')
                    .map((m) => ({ value: m.numericId || m.code, label: `🏢 ${m.label || m.name}` }))}
                  placeholder="-- Pilih Kantor Polisi (Mako) --"
                  title="Pilih Kantor Polisi (Mako)"
                  searchable={true}
                />
              </div>
              <div>
                <label className="form-label-reg" style={{ marginBottom: '6px' }}>
                  Kelompok Regu / Beat Patroli
                </label>
                <input
                  type="text"
                  className="form-control-reg"
                  placeholder="Contoh: Regu Alpha / Tim Perintis"
                  value={formData.kelompokRegu || ''}
                  onChange={(e) => setFormData({ ...formData, kelompokRegu: e.target.value })}
                />
              </div>
            </div>

            {/* 3. KREDENSIAL & TRACKING GPS */}
            <div className="form-section-divider">
              <div className="form-section-title">
                <span>🔐</span> 3. Kredensial &amp; Tracking GPS
              </div>
            </div>

            <div className="master-form-grid-2">
              <div>
                <label className="form-label-reg" style={{ marginBottom: '6px' }}>
                  Kata Sandi Login {formData.oldNrp ? <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 'normal' }}>(Opsional saat edit)</span> : <span className="req">*</span>}
                </label>
                <input
                  type="password"
                  className="form-control-reg"
                  placeholder={formData.oldNrp ? "Kosongkan jika tidak diubah" : "Minimal 6 karakter sandi"}
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!formData.oldNrp}
                />
              </div>
              <div>
                <label className="form-label-reg" style={{ marginBottom: '6px' }}>
                  Device ID GPS Personil
                </label>
                <div className="input-group-reg">
                  <input
                    type="text"
                    className="form-control-reg font-mono"
                    placeholder="Contoh: DEV-HP-9F2B81C4"
                    value={formData.deviceId || ''}
                    onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                  />
                  {onOpenQrModal && (
                    <button
                      type="button"
                      className="btn-addon-reg"
                      onClick={() => onOpenQrModal(formData.nrp || '', formData.unitId || '')}
                      title="Bind via QR Scanner"
                    >
                      <span>📱</span> Scan QR
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        );
      }}
    />
  );
}
