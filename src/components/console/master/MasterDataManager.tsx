'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  getMasterRanksAction,
  createMasterRankAction,
  updateMasterRankAction,
  deleteMasterRankAction,
  getMasterOperationalUnitsAction,
  createMasterOperationalUnitAction,
  updateMasterOperationalUnitAction,
  deleteMasterOperationalUnitAction,
  getMasterRolesAction,
  createMasterRoleAction,
  updateMasterRoleAction,
  deleteMasterRoleAction,
  getPoliceStationsMasterAction,
  createPoliceStationMasterAction,
  updatePoliceStationMasterAction,
  deletePoliceStationMasterAction,
  getMasterIncidentCategoriesAction,
  createMasterIncidentCategoryAction,
  updateMasterIncidentCategoryAction,
  deleteMasterIncidentCategoryAction,
  getMasterHotspotCategoriesAction,
  createMasterHotspotCategoryAction,
  updateMasterHotspotCategoryAction,
  deleteMasterHotspotCategoryAction,
  getMasterHotspotsAction,
  createMasterHotspotAction,
  updateMasterHotspotAction,
  deleteMasterHotspotAction,
  getMasterVehiclesAction,
  createMasterVehicleAction,
  updateMasterVehicleAction,
  deleteMasterVehicleAction,
  getMasterDutyStatusesAction,
  createMasterDutyStatusAction,
  updateMasterDutyStatusAction,
  deleteMasterDutyStatusAction,
} from '@/app/actions/master.actions';

const MiniMapPicker = dynamic(() => import('@/components/MiniMapPicker'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: '220px',
        background: '#F1F5F9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748B',
        fontSize: '12px',
        borderRadius: '8px',
      }}
    >
      ⏳ Memuat Peta Interaktif...
    </div>
  ),
});

export type MasterTabType =
  | 'pangkat'
  | 'satuan'
  | 'role'
  | 'station'
  | 'armada'
  | 'hotspot'
  | 'hotspot_cat'
  | 'kategori'
  | 'duty';

interface MasterDataManagerProps {
  activeTab: MasterTabType;
  onRefreshDropdowns?: () => void;
  showToast: (msg: string) => void;
}

export default function MasterDataManager({
  activeTab,
  onRefreshDropdowns,
  showToast,
}: MasterDataManagerProps) {
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Khusus Titik Rawan GIS
  const [showMiniPickerRawan, setShowMiniPickerRawan] = useState(false);

  // Form Fields State
  const [formData, setFormData] = useState<any>({
    key: '',
    label: '',
    display_order: 1,
    is_active: true,
    // Satuan
    unit_name: '',
    short_name: '',
    icon_emoji: '🚔',
    duties: '',
    default_orders: '',
    // Role
    description: '',
    // Station
    station_code: '',
    station_name: '',
    station_level: 'POLSEK',
    address: '',
    office_lat: -6.2415,
    office_lng: 106.8021,
    geofence_radius_meters: 500,
    // Armada Operasional
    nomor_lambung: '',
    nama_armada: '',
    jenis_kendaraan: 'RODA_4',
    plat_nomor_polisi: '',
    status_operasional: 'SIAGA',
    driver_officer_nrp: '',
    current_lat: -6.2415,
    current_lng: 106.8021,
    // Titik Rawan GIS (Gambar 3)
    title: '',
    police_sector: 'Polsek Metro Setiabudi',
    category: 'Rawan Tawuran Warga & Gesekan Kelompok',
    danger_level: 'Status: PENGAWASAN PRIORITAS (RAWAN)',
    lat: -6.2415,
    lng: 106.8021,
    active_start: '23:00',
    active_end: '04:30',
    schedule_display: '23:00 - 04:30',
    nearest_unit: 'AIPTU Herman Sulistyo',
    // Kategori & Status
    icon: '🚨',
    badge_bg: '#EFF6FF',
    badge_color: '#1D4ED8',
    badge_border: '#BFDBFE',
  });

  // Load Data based on activeTab
  const loadTabData = async () => {
    setLoading(true);
    try {
      let res: any;
      switch (activeTab) {
        case 'pangkat':
          res = await getMasterRanksAction();
          break;
        case 'satuan':
          res = await getMasterOperationalUnitsAction();
          break;
        case 'role':
          res = await getMasterRolesAction();
          break;
        case 'station':
          res = await getPoliceStationsMasterAction();
          break;
        case 'armada':
          res = await getMasterVehiclesAction();
          break;
        case 'hotspot':
          res = await getMasterHotspotsAction();
          break;
        case 'hotspot_cat':
          res = await getMasterHotspotCategoriesAction();
          break;
        case 'kategori':
          res = await getMasterIncidentCategoriesAction();
          break;
        case 'duty':
          res = await getMasterDutyStatusesAction();
          break;
      }
      if (res && res.success && res.data) {
        setDataList(res.data);
      }
    } catch (err: any) {
      showToast(`Gagal memuat master data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchQuery('');
    setFilterActive('all');
    setShowMiniPickerRawan(false);
    loadTabData();
  }, [activeTab]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setModalMode('add');
    setEditingId(null);
    setShowMiniPickerRawan(false);
    setFormData({
      key: '',
      label: '',
      display_order: dataList.length + 1,
      is_active: true,
      unit_name: '',
      short_name: '',
      icon_emoji:
        activeTab === 'satuan'
          ? '🚔'
          : activeTab === 'armada'
          ? '🚔'
          : '🔴',
      duties: '',
      default_orders: '',
      description: '',
      station_code: '',
      station_name: '',
      station_level: 'POLSEK',
      address: '',
      office_lat: -6.2415,
      office_lng: 106.8021,
      geofence_radius_meters: 500,
      nomor_lambung: '',
      nama_armada: '',
      jenis_kendaraan: 'RODA_4',
      plat_nomor_polisi: '',
      status_operasional: 'SIAGA',
      driver_officer_nrp: '',
      current_lat: -6.2415,
      current_lng: 106.8021,
      title: '',
      police_sector: 'Polsek Metro Setiabudi',
      category: 'Rawan Tawuran Warga & Gesekan Kelompok',
      danger_level: 'Status: PENGAWASAN PRIORITAS (RAWAN)',
      lat: -6.2415,
      lng: 106.8021,
      active_start: '23:00',
      active_end: '04:30',
      schedule_display: '23:00 - 04:30',
      nearest_unit: 'AIPTU Herman Sulistyo',
      icon: '🚨',
      badge_bg: '#EFF6FF',
      badge_color: '#1D4ED8',
      badge_border: '#BFDBFE',
    });
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: any) => {
    setModalMode('edit');
    setEditingId(item.id);
    setShowMiniPickerRawan(false);
    setFormData({
      key: item.key || item.station_code || item.nomor_lambung || '',
      label: item.label || item.station_name || item.unit_name || item.nama_armada || item.title || '',
      display_order: item.display_order || 1,
      is_active: item.is_active !== undefined ? item.is_active : true,
      unit_name: item.unit_name || '',
      short_name: item.short_name || '',
      icon_emoji: item.icon_emoji || '🚔',
      duties: item.duties || '',
      default_orders: item.default_orders || '',
      description: item.description || '',
      station_code: item.station_code || '',
      station_name: item.station_name || '',
      station_level: item.station_level || 'POLSEK',
      address: item.address || '',
      office_lat: item.office_lat ? Number(item.office_lat) : -6.2415,
      office_lng: item.office_lng ? Number(item.office_lng) : 106.8021,
      geofence_radius_meters: item.geofence_radius_meters || 500,
      nomor_lambung: item.nomor_lambung || '',
      nama_armada: item.nama_armada || '',
      jenis_kendaraan: item.jenis_kendaraan || 'RODA_4',
      plat_nomor_polisi: item.plat_nomor_polisi || '',
      status_operasional: item.status_operasional || 'SIAGA',
      driver_officer_nrp: item.driver_officer_nrp || '',
      current_lat: item.current_lat ? Number(item.current_lat) : -6.2415,
      current_lng: item.current_lng ? Number(item.current_lng) : 106.8021,
      title: item.title || '',
      police_sector: item.police_sector || 'Polsek Metro Setiabudi',
      category: item.category || 'Rawan Tawuran Warga & Gesekan Kelompok',
      danger_level: item.danger_level || 'Status: PENGAWASAN PRIORITAS (RAWAN)',
      lat: item.lat ? Number(item.lat) : -6.2415,
      lng: item.lng ? Number(item.lng) : 106.8021,
      active_start: item.active_start || '23:00',
      active_end: item.active_end || '04:30',
      schedule_display: item.schedule_display || '23:00 - 04:30',
      nearest_unit: item.nearest_unit || 'AIPTU Herman Sulistyo',
      icon: item.icon || '🚨',
      badge_bg: item.badge_bg || '#EFF6FF',
      badge_color: item.badge_color || '#1D4ED8',
      badge_border: item.badge_border || '#BFDBFE',
    });
    setShowModal(true);
  };

  // Submit Add or Edit
  const handleSubmitForm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormSubmitting(true);
    try {
      let res: any;
      if (modalMode === 'add') {
        switch (activeTab) {
          case 'pangkat':
            res = await createMasterRankAction(formData);
            break;
          case 'satuan':
            res = await createMasterOperationalUnitAction(formData);
            break;
          case 'role':
            res = await createMasterRoleAction(formData);
            break;
          case 'station':
            res = await createPoliceStationMasterAction(formData);
            break;
          case 'armada':
            res = await createMasterVehicleAction(formData);
            break;
          case 'hotspot': {
            const autoKey =
              formData.key?.trim() ||
              `HS-${(formData.title || 'RAWAN').replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;
            res = await createMasterHotspotAction({
              ...formData,
              key: autoKey,
            });
            break;
          }
          case 'hotspot_cat':
            res = await createMasterHotspotCategoryAction(formData);
            break;
          case 'kategori':
            res = await createMasterIncidentCategoryAction(formData);
            break;
          case 'duty':
            res = await createMasterDutyStatusAction(formData);
            break;
        }
      } else {
        if (!editingId) return;
        switch (activeTab) {
          case 'pangkat':
            res = await updateMasterRankAction(Number(editingId), formData);
            break;
          case 'satuan':
            res = await updateMasterOperationalUnitAction(Number(editingId), formData);
            break;
          case 'role':
            res = await updateMasterRoleAction(Number(editingId), formData);
            break;
          case 'station':
            res = await updatePoliceStationMasterAction(Number(editingId), formData);
            break;
          case 'armada':
            res = await updateMasterVehicleAction(Number(editingId), formData);
            break;
          case 'hotspot':
            res = await updateMasterHotspotAction(editingId, formData);
            break;
          case 'hotspot_cat':
            res = await updateMasterHotspotCategoryAction(Number(editingId), formData);
            break;
          case 'kategori':
            res = await updateMasterIncidentCategoryAction(Number(editingId), formData);
            break;
          case 'duty':
            res = await updateMasterDutyStatusAction(Number(editingId), formData);
            break;
        }
      }

      if (res && res.success) {
        showToast(
          modalMode === 'add'
            ? '✓ Data master baru berhasil disimpan ke database!'
            : '✓ Data master berhasil diperbarui di database!'
        );
        setShowModal(false);
        loadTabData();
        if (onRefreshDropdowns) onRefreshDropdowns();
      } else {
        alert(res?.error || 'Gagal menyimpan data master.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: number | string, label: string) => {
    if (!confirm(`Hapus data master "${label}"? Tindakan ini permanen di database SIMAPRES.`)) {
      return;
    }

    try {
      let res: any;
      switch (activeTab) {
        case 'pangkat':
          res = await deleteMasterRankAction(Number(id));
          break;
        case 'satuan':
          res = await deleteMasterOperationalUnitAction(Number(id));
          break;
        case 'role':
          res = await deleteMasterRoleAction(Number(id));
          break;
        case 'station':
          res = await deletePoliceStationMasterAction(Number(id));
          break;
        case 'armada':
          res = await deleteMasterVehicleAction(Number(id));
          break;
        case 'hotspot':
          res = await deleteMasterHotspotAction(id);
          break;
        case 'hotspot_cat':
          res = await deleteMasterHotspotCategoryAction(Number(id));
          break;
        case 'kategori':
          res = await deleteMasterIncidentCategoryAction(Number(id));
          break;
        case 'duty':
          res = await deleteMasterDutyStatusAction(Number(id));
          break;
      }

      if (res && res.success) {
        showToast(`✓ Data master "${label}" berhasil dihapus.`);
        loadTabData();
        if (onRefreshDropdowns) onRefreshDropdowns();
      } else {
        alert(res?.error || 'Gagal menghapus data master.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem saat menghapus data.');
    }
  };

  // Filtered List
  const filteredData = dataList.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      (item.key && item.key.toLowerCase().includes(q)) ||
      (item.label && item.label.toLowerCase().includes(q)) ||
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.nomor_lambung && item.nomor_lambung.toLowerCase().includes(q)) ||
      (item.nama_armada && item.nama_armada.toLowerCase().includes(q)) ||
      (item.plat_nomor_polisi && item.plat_nomor_polisi.toLowerCase().includes(q)) ||
      (item.police_sector && item.police_sector.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q)) ||
      (item.danger_level && item.danger_level.toLowerCase().includes(q)) ||
      (item.station_code && item.station_code.toLowerCase().includes(q)) ||
      (item.station_name && item.station_name.toLowerCase().includes(q)) ||
      (item.unit_name && item.unit_name.toLowerCase().includes(q)) ||
      (item.short_name && item.short_name.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.address && item.address.toLowerCase().includes(q));

    if (!matchQuery) return false;

    if (activeTab !== 'armada' && activeTab !== 'hotspot') {
      if (filterActive === 'active' && item.is_active === false) return false;
      if (filterActive === 'inactive' && item.is_active === true) return false;
    }

    return true;
  });

  // Tab Title & Info Helpers
  const getTabConfig = () => {
    switch (activeTab) {
      case 'pangkat':
        return {
          title: 'Master Pangkat Kepolisian',
          desc: 'Tingkatan pangkat personel Polri untuk hierarki kepangkatan dan formulir registrasi unit.',
          addBtn: 'Tambah Pangkat Baru',
          icon: '🎖️',
        };
      case 'satuan':
        return {
          title: 'Master Satuan Operasional',
          desc: 'Daftar kesatuan fungsi Polri (Samapta, Lantas, Reskrim, Binmas, Intelkam) beserta SOP perintah taktis.',
          addBtn: 'Tambah Satuan Unit',
          icon: '🚔',
        };
      case 'role':
        return {
          title: 'Master Peran & Hak Akses (Role)',
          desc: 'Pengaturan otorisasi sistem Presisi (SUPERADMIN, PAWAS, PERSONIL, OPERATOR_110).',
          addBtn: 'Tambah Role Akses',
          icon: '🛡️',
        };
      case 'station':
        return {
          title: 'Master Kantor Polisi & Posko (Mako)',
          desc: 'Pangkalan data Markas Komando (Polda, Polres, Polsek, Pospol) lengkap dengan koordinat GPS dan radius geofence.',
          addBtn: 'Tambah Kantor Polisi',
          icon: '🏢',
        };
      case 'armada':
        return {
          title: 'Master Armada Operasional & Ranmor Patroli',
          desc: 'Database armada kendaraan dinas patroli (Mobil Patroli R4, Motor Trail Perintis R2, Ranmor Opsnal, Minibus) dengan QR Token fisik.',
          addBtn: 'Tambah Armada Patroli',
          icon: '🚓',
        };
      case 'hotspot':
        return {
          title: 'Master Titik Rawan Kriminalitas & Laka (GIS)',
          desc: 'Pemetaan koordinat zona rawan kejahatan jalanan, tawuran warga, balap liar, dan kecelakaan dengan radius pantau terpadu.',
          addBtn: 'Tambah Titik Rawan',
          icon: '📍',
        };
      case 'hotspot_cat':
        return {
          title: 'Master Kategori Titik Rawan',
          desc: 'Klasifikasi jenis kerawanan wilayah (Tawuran, Balap Liar, 3C, Narkotika, Kemacetan) untuk radar intelijen kamtibmas.',
          addBtn: 'Tambah Kategori Rawan',
          icon: '🏷️',
        };
      case 'kategori':
        return {
          title: 'Master Kategori Kejadian Insiden',
          desc: 'Klasifikasi tindak pidana, gangguan kamtibmas, laka lantas, dan situasi darurat masyarakat aduan 110.',
          addBtn: 'Tambah Kategori Kejadian',
          icon: '🚨',
        };
      case 'duty':
        return {
          title: 'Master Status Kedinasan Personel',
          desc: 'Daftar status kedinasan siaga personel (Dinas Patroli, Piket SPKT, Cadangan, Lepas Dinas, BKO).',
          addBtn: 'Tambah Status Tugas',
          icon: '📋',
        };
    }
  };

  const config = getTabConfig();

  return (
    <div style={{ padding: '0 0 40px 0' }}>
      {/* Top Banner Master Manager */}
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px 24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '24px' }}>{config.icon}</span>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              {config.title}
            </h2>
            <span
              style={{
                background: '#EFF6FF',
                color: '#1D4ED8',
                fontWeight: 800,
                fontSize: '11px',
                padding: '3px 10px',
                borderRadius: '20px',
                border: '1px solid #BFDBFE',
              }}
            >
              Total: {filteredData.length} Data
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '12.5px', color: '#64748B', maxWidth: '750px', lineHeight: 1.5 }}>
            {config.desc}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          style={{
            background: 'linear-gradient(135deg, #153E75 0%, #2563EB 100%)',
            color: 'white',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '10px',
            fontWeight: 800,
            fontSize: '12.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
            transition: 'all 0.2s',
          }}
        >
          <span>➕</span>
          <span>{config.addBtn}</span>
        </button>
      </div>

      {/* Filter & Live Search Bar */}
      <div
        style={{
          background: 'white',
          borderRadius: '14px',
          padding: '14px 18px',
          border: '1px solid #E2E8F0',
          marginBottom: '16px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <input
            type="text"
            placeholder={`🔍 Cari ${config.title.toLowerCase()} berdasarkan kode, nama, nomor lambung, sektor...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 14px',
              paddingLeft: '36px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '12.5px',
              outline: 'none',
              background: '#F8FAFC',
              boxSizing: 'border-box',
            }}
          />
          <span style={{ position: 'absolute', left: '12px', top: '9px', fontSize: '13px' }}>🔍</span>
        </div>

        {/* Filter Status Aktif */}
        {activeTab !== 'station' && activeTab !== 'armada' && activeTab !== 'hotspot' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Status:</span>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as any)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">Semua Status</option>
              <option value="active">✓ Hanya Aktif</option>
              <option value="inactive">✕ Nonaktif</option>
            </select>
          </div>
        )}

        <button
          type="button"
          onClick={loadTabData}
          title="Muat Ulang Data"
          style={{
            background: '#F1F5F9',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#475569',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>🔄</span>
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Data Table */}
      <div
        style={{
          background: 'white',
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', color: '#475569', fontWeight: 800 }}>
                <th style={{ padding: '12px 16px', width: '50px' }}>NO</th>
                
                {activeTab === 'armada' ? (
                  <>
                    <th style={{ padding: '12px 16px' }}>NO. LAMBUNG</th>
                    <th style={{ padding: '12px 16px' }}>NAMA ARMADA</th>
                    <th style={{ padding: '12px 16px' }}>JENIS &amp; PLAT POLISI</th>
                    <th style={{ padding: '12px 16px' }}>STATUS OPERASIONAL</th>
                    <th style={{ padding: '12px 16px' }}>NRP PENGEMUDI</th>
                    <th style={{ padding: '12px 16px' }}>QR TOKEN</th>
                  </>
                ) : activeTab === 'hotspot' ? (
                  <>
                    <th style={{ padding: '12px 16px' }}>KODE RAWAN</th>
                    <th style={{ padding: '12px 16px' }}>NAMA TITIK RAWAN</th>
                    <th style={{ padding: '12px 16px' }}>WILAYAH SEKTOR</th>
                    <th style={{ padding: '12px 16px' }}>KATEGORI &amp; TINGKAT</th>
                    <th style={{ padding: '12px 16px' }}>KOORDINAT GPS</th>
                    <th style={{ padding: '12px 16px' }}>JAM RAWAN &amp; UNIT PATROLI</th>
                  </>
                ) : (
                  <>
                    <th style={{ padding: '12px 16px' }}>KODE / KEY</th>
                    <th style={{ padding: '12px 16px' }}>NAMA / LABEL</th>
                    {activeTab === 'satuan' && <th style={{ padding: '12px 16px' }}>SINGKATAN &amp; TUPOKSI</th>}
                    {activeTab === 'role' && <th style={{ padding: '12px 16px' }}>WEWENANG SISTEM</th>}
                    {activeTab === 'station' && <th style={{ padding: '12px 16px' }}>TINGKAT &amp; ALAMAT</th>}
                    {activeTab === 'station' && <th style={{ padding: '12px 16px' }}>KOORDINAT &amp; GEOFENCE</th>}
                    {activeTab === 'duty' && <th style={{ padding: '12px 16px' }}>PREVIEW BADGE</th>}
                    {activeTab !== 'station' && <th style={{ padding: '12px 16px', width: '90px' }}>URUTAN</th>}
                    {activeTab !== 'station' && <th style={{ padding: '12px 16px', width: '100px' }}>STATUS</th>}
                  </>
                )}
                <th style={{ padding: '12px 16px', width: '140px', textAlign: 'center' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                    <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</div> Memuat data master dari database...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                    Belum ada data master yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#64748B' }}>{idx + 1}</td>

                    {/* BARIS KHUSUS ARMADA OPERASIONAL */}
                    {activeTab === 'armada' ? (
                      <>
                        <td style={{ padding: '14px 16px' }}>
                          <code
                            style={{
                              background: '#F1F5F9',
                              color: '#0F172A',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '11.5px',
                            }}
                          >
                            {item.nomor_lambung}
                          </code>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#1E293B' }}>
                          {item.nama_armada}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '12px' }}>
                          <span style={{ fontWeight: 700, color: '#1E40AF', background: '#DBEAFE', padding: '2px 6px', borderRadius: '4px', marginRight: '6px' }}>
                            {item.jenis_kendaraan}
                          </span>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0F172A' }}>
                            {item.plat_nomor_polisi || '-'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '12px',
                              background:
                                item.status_operasional === 'SIAGA'
                                  ? '#ECFDF5'
                                  : item.status_operasional === 'PATROLI'
                                  ? '#EFF6FF'
                                  : item.status_operasional === 'MENUJU_TKP'
                                  ? '#FEF2F2'
                                  : '#F1F5F9',
                              color:
                                item.status_operasional === 'SIAGA'
                                  ? '#059669'
                                  : item.status_operasional === 'PATROLI'
                                  ? '#2563EB'
                                  : item.status_operasional === 'MENUJU_TKP'
                                  ? '#DC2626'
                                  : '#64748B',
                              border: '1px solid currentColor',
                            }}
                          >
                            ● {item.status_operasional}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#475569' }}>
                          {item.driver_officer_nrp || '-'}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <code style={{ fontSize: '11px', color: '#6366F1', background: '#EEF2FF', padding: '2px 6px', borderRadius: '4px' }}>
                            {item.qr_token}
                          </code>
                        </td>
                      </>
                    ) : activeTab === 'hotspot' ? (
                      /* BARIS KHUSUS TITIK RAWAN GIS */
                      <>
                        <td style={{ padding: '14px 16px' }}>
                          <code
                            style={{
                              background: '#FEE2E2',
                              color: '#991B1B',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontWeight: 800,
                              fontSize: '11.5px',
                            }}
                          >
                            {item.key}
                          </code>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#1E293B' }}>
                          {item.title}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#475569', fontSize: '12px' }}>
                          {item.police_sector}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '12px' }}>
                          <span style={{ fontWeight: 800, color: '#B91C1C', background: '#FEE2E2', padding: '2px 6px', borderRadius: '4px', marginRight: '6px' }}>
                            {item.category}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748B' }}>
                            {item.danger_level}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '11.5px', color: '#2563EB' }}>
                          📍 {Number(item.lat).toFixed(4)}, {Number(item.lng).toFixed(4)}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '12px' }}>
                          <div style={{ fontWeight: 700, color: '#D97706' }}>🕒 {item.schedule_display || `${item.active_start} - ${item.active_end} WIB`}</div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>🚔 {item.nearest_unit}</div>
                        </td>
                      </>
                    ) : (
                      /* BARIS MASTER REGULER */
                      <>
                        {/* Kode / Key */}
                        <td style={{ padding: '14px 16px' }}>
                          <code
                            style={{
                              background: '#F1F5F9',
                              color: '#0F172A',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '11.5px',
                            }}
                          >
                            {item.key || item.station_code}
                          </code>
                        </td>

                        {/* Nama / Label */}
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#1E293B' }}>
                          {item.label || item.station_name || item.unit_name}
                        </td>

                        {/* Kolom Spesifik Satuan */}
                        {activeTab === 'satuan' && (
                          <td style={{ padding: '14px 16px', color: '#475569', fontSize: '12px', maxWidth: '300px' }}>
                            <div style={{ fontWeight: 700, color: '#153E75', marginBottom: '2px' }}>{item.short_name}</div>
                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.duties}</div>
                          </td>
                        )}

                        {/* Kolom Spesifik Role */}
                        {activeTab === 'role' && (
                          <td style={{ padding: '14px 16px', color: '#64748B', fontSize: '12px', maxWidth: '320px' }}>
                            {item.description || '-'}
                          </td>
                        )}

                        {/* Kolom Spesifik Station */}
                        {activeTab === 'station' && (
                          <td style={{ padding: '14px 16px', fontSize: '12px' }}>
                            <span style={{ fontWeight: 800, color: '#2563EB', background: '#EFF6FF', padding: '2px 6px', borderRadius: '4px', marginRight: '6px' }}>
                              {item.station_level}
                            </span>
                            <span style={{ color: '#475569' }}>{item.address}</span>
                          </td>
                        )}
                        {activeTab === 'station' && (
                          <td style={{ padding: '14px 16px', fontSize: '12px', fontFamily: 'monospace', color: '#475569' }}>
                            📍 {Number(item.office_lat).toFixed(4)}, {Number(item.office_lng).toFixed(4)}
                            <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>Geofence: {item.geofence_radius_meters}m</div>
                          </td>
                        )}

                        {/* Kolom Spesifik Duty Status Preview */}
                        {activeTab === 'duty' && (
                          <td style={{ padding: '14px 16px' }}>
                            <span
                              style={{
                                background: item.badge_bg || '#ECFDF5',
                                color: item.badge_color || '#10B981',
                                border: '1px solid currentColor',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 800,
                              }}
                            >
                              ● {item.label}
                            </span>
                          </td>
                        )}

                        {/* Urutan */}
                        {activeTab !== 'station' && (
                          <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: '#64748B' }}>
                            {item.display_order || 1}
                          </td>
                        )}

                        {/* Status Aktif */}
                        {activeTab !== 'station' && (
                          <td style={{ padding: '14px 16px' }}>
                            {item.is_active ? (
                              <span
                                style={{
                                  background: '#ECFDF5',
                                  color: '#059669',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  padding: '3px 8px',
                                  borderRadius: '12px',
                                  border: '1px solid #A7F3D0',
                                }}
                              >
                                ✓ Aktif
                              </span>
                            ) : (
                              <span
                                style={{
                                  background: '#FEF2F2',
                                  color: '#DC2626',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  padding: '3px 8px',
                                  borderRadius: '12px',
                                  border: '1px solid #FECACA',
                                }}
                              >
                                ✕ Nonaktif
                              </span>
                            )}
                          </td>
                        )}
                      </>
                    )}

                    {/* Aksi Edit & Hapus */}
                    <td style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        style={{
                          background: '#EFF6FF',
                          color: '#2563EB',
                          border: '1px solid #BFDBFE',
                          borderRadius: '6px',
                          padding: '5px 10px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          marginRight: '6px',
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            item.id,
                            item.label || item.station_name || item.unit_name || item.nama_armada || item.title || item.key
                          )
                        }
                        style={{
                          background: '#FEF2F2',
                          color: '#DC2626',
                          border: '1px solid #FECACA',
                          borderRadius: '6px',
                          padding: '5px 10px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL FORM MASTER DATA (SEMUA TAB MASTER)                                 */}
      {/* ========================================================================= */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => !formSubmitting && setShowModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: activeTab === 'hotspot' ? '720px' : activeTab === 'armada' ? '600px' : '560px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #153E75 0%, #0D264A 100%)',
                color: 'white',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>{modalMode === 'add' ? '➕' : '✏️'}</span>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>
                  {modalMode === 'add' ? `Tambah ${config.title}` : `Edit ${config.title}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !formSubmitting && setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '18px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitForm} style={{ padding: '20px', overflowY: 'auto' }}>
              {/* KHUSUS TITIK RAWAN KAMTIBMAS (INPUT SESUAI SCREENSHOT) */}
              {activeTab === 'hotspot' ? (
                <>
                  {/* Grid 2 Kolom Baris 1: Cari Alamat / Lokasi Rawan & Wilayah / Polsek Pengampu */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        🔍 Cari Alamat / Lokasi Rawan <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Kawasan Taman Barito & Melawai"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          fontSize: '12.5px',
                          background: 'white',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Wilayah / Polsek Pengampu <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Polsek Kebayoran Baru"
                        value={formData.police_sector}
                        onChange={(e) => setFormData({ ...formData, police_sector: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          fontSize: '12.5px',
                          background: 'white',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  {/* Grid 2 Kolom Baris 2: Kategori Kerawanan & Tingkat Status Bahaya */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Kategori Kerawanan <span style={{ color: 'red' }}>*</span>
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          fontSize: '12.5px',
                          background: 'white',
                          boxSizing: 'border-box',
                        }}
                      >
                        <option value="Rawan Tawuran Warga & Gesekan Kelompok">Rawan Tawuran Warga &amp; Gesekan Kelompok</option>
                        <option value="Rawan Tawuran Pelajar Ber-sajam">Rawan Tawuran Pelajar Ber-sajam</option>
                        <option value="Rawan Balap Liar & Gangguan Knalpot Brong">Rawan Balap Liar &amp; Gangguan Knalpot Brong</option>
                        <option value="Rawan Curas, Curat & Begal Jalanan (3C)">Rawan Curas, Curat &amp; Begal Jalanan (3C)</option>
                        <option value="Rawan Narkoba & Miras Oplosan">Rawan Narkoba &amp; Miras Oplosan</option>
                        <option value="Rawan Kemacetan Parah & Pasar Tumpah">Rawan Kemacetan Parah &amp; Pasar Tumpah</option>
                        <option value="Objek Vital & Titik Kumpul Massa">Objek Vital &amp; Titik Kumpul Massa</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Tingkat Status Bahaya <span style={{ color: 'red' }}>*</span>
                      </label>
                      <select
                        value={formData.danger_level}
                        onChange={(e) => setFormData({ ...formData, danger_level: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          fontSize: '12.5px',
                          background: 'white',
                          boxSizing: 'border-box',
                        }}
                      >
                        <option value="Status: PENGAWASAN PRIORITAS (RAWAN)">Status: PENGAWASAN PRIORITAS (🔴 Merah)</option>
                        <option value="Status: SIAGA PATROLI BLUE LIGHT">Status: SIAGA PATROLI BLUE LIGHT (🟠 Oranye)</option>
                        <option value="Status: INSIDEN DARURAT AKTIF (SIAGA 110)">Status: INSIDEN DARURAT AKTIF (SIAGA 110)</option>
                        <option value="Status: PEMANTAUAN RUTIN">Status: PEMANTAUAN RUTIN (🟡 Kuning)</option>
                      </select>
                    </div>
                  </div>

                  {/* Grid 2 Kolom Baris 3: Jadwal / Jam Rawan & Unit Terdekat / PIC Lapangan */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        🕒 Jadwal / Jam Rawan <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="22:00 - 05:00 WIB"
                        value={formData.schedule_display}
                        onChange={(e) => setFormData({ ...formData, schedule_display: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          fontSize: '12.5px',
                          background: 'white',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Unit Terdekat / PIC Lapangan
                      </label>
                      <input
                        type="text"
                        placeholder="Patroli Samapta 110-B"
                        value={formData.nearest_unit}
                        onChange={(e) => setFormData({ ...formData, nearest_unit: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          fontSize: '12.5px',
                          background: 'white',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  {/* Koordinat GPS & Peta Interaktif */}
                  <div
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '14px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px',
                        marginBottom: '8px',
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                        Titik Koordinat Lokasi Rawan
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setShowMiniPickerRawan(!showMiniPickerRawan)}
                          style={{
                            background: '#0284C7',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          📖 {showMiniPickerRawan ? 'Sembunyikan Peta' : 'Pilih Titik dari Maps'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof navigator !== 'undefined' && navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition(
                                (pos) => {
                                  setFormData((prev: any) => ({
                                    ...prev,
                                    lat: Number(pos.coords.latitude.toFixed(6)),
                                    lng: Number(pos.coords.longitude.toFixed(6)),
                                  }));
                                  showToast('✓ Lokasi GPS saat ini berhasil diambil!');
                                },
                                (err) => {
                                  alert('Gagal mengambil GPS: ' + err.message);
                                },
                                { enableHighAccuracy: true }
                              );
                            }
                          }}
                          style={{
                            background: '#FFFFFF',
                            color: '#DC2626',
                            border: '1px solid #FECACA',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          📍 Lokasi Saya (GPS)
                        </button>
                      </div>
                    </div>

                    {showMiniPickerRawan && (
                      <div style={{ marginBottom: '10px', marginTop: '10px' }}>
                        <MiniMapPicker
                          lat={formData.lat}
                          lng={formData.lng}
                          onChange={(pickedLat, pickedLng) => {
                            setFormData((prev: any) => ({
                              ...prev,
                              lat: pickedLat,
                              lng: pickedLng,
                            }));
                          }}
                          height="220px"
                        />
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px', fontWeight: 600 }}>
                          Latitude
                        </label>
                        <input
                          type="number"
                          step="0.00000001"
                          value={formData.lat}
                          onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) || 0 })}
                          style={{
                            width: '100%',
                            padding: '7px 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px', fontWeight: 600 }}>
                          Longitude
                        </label>
                        <input
                          type="number"
                          step="0.00000001"
                          value={formData.lng}
                          onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) || 0 })}
                          style={{
                            width: '100%',
                            padding: '7px 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Urutan & Keaktifan */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Urutan Tampilan
                      </label>
                      <input
                        type="number"
                        value={formData.display_order}
                        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          fontSize: '12.5px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Status Keaktifan
                      </label>
                      <select
                        value={formData.is_active ? '1' : '0'}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.value === '1' })}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          fontSize: '12.5px',
                          boxSizing: 'border-box',
                        }}
                      >
                        <option value="1">✓ Aktif Digunakan</option>
                        <option value="0">✕ Nonaktifkan</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : activeTab === 'armada' ? (
                <>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Nomor Lambung Kendaraan <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: R4-SAMAPTA-01 / SEDAN-PJR-01"
                      value={formData.nomor_lambung}
                      onChange={(e) => setFormData({ ...formData, nomor_lambung: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', fontFamily: 'monospace', fontWeight: 700, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Nama Armada Patroli <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Mobil Patroli Samapta Presisi R4-01"
                      value={formData.nama_armada}
                      onChange={(e) => setFormData({ ...formData, nama_armada: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Jenis Kendaraan
                      </label>
                      <select
                        value={formData.jenis_kendaraan}
                        onChange={(e) => setFormData({ ...formData, jenis_kendaraan: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }}
                      >
                        <option value="RODA_4">Mobil Patroli Sedan / SUV (RODA_4)</option>
                        <option value="RODA_2">Sepeda Motor Trail / Taktis (RODA_2)</option>
                        <option value="MINIBUS">Kendaraan Taktis Minibus (MINIBUS)</option>
                        <option value="WATER_CANNON">Rantis Pengurai Massa (WATER_CANNON)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Plat Nomor Dinas Polisi
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 1001-VII"
                        value={formData.plat_nomor_polisi}
                        onChange={(e) => setFormData({ ...formData, plat_nomor_polisi: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Status Kesiapsiagaan
                      </label>
                      <select
                        value={formData.status_operasional}
                        onChange={(e) => setFormData({ ...formData, status_operasional: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }}
                      >
                        <option value="SIAGA">🟢 SIAGA (Standby Mako / Beat)</option>
                        <option value="PATROLI">🔵 PATROLI (Mobile Lapangan)</option>
                        <option value="MENUJU_TKP">🔴 MENUJU_TKP (Tanggap Darurat 110)</option>
                        <option value="PEMELIHARAAN">⚪ PEMELIHARAAN (Bengkel / Servis)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        NRP Pengemudi / Unit
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 95020123"
                        value={formData.driver_officer_nrp}
                        onChange={(e) => setFormData({ ...formData, driver_officer_nrp: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* FORM FIELDS STANDAR (PANGKAT, SATUAN, ROLE, STATION) */
                <>
                  {activeTab !== 'station' && (
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Kode / Identifier Unik <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: BRIPKA / SABHARA"
                        value={formData.key}
                        onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          fontSize: '12.5px',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  )}

                  {activeTab !== 'satuan' && activeTab !== 'station' && (
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Label / Nama Tampilan <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Bripka (Brigadir Polisi Kepala)"
                        value={formData.label}
                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          fontSize: '12.5px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  )}

                  {/* Satuan Operasional Spesifik */}
                  {activeTab === 'satuan' && (
                    <>
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          Nama Lengkap Satuan <span style={{ color: 'red' }}>*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Satuan Samapta Presisi"
                          value={formData.unit_name}
                          onChange={(e) => setFormData({ ...formData, unit_name: e.target.value })}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          Nama Singkat / Singkatan
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Sat Samapta"
                          value={formData.short_name}
                          onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          Tugas Pokok &amp; Fungsi (Tupoksi)
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Uraian tugas pokok satuan..."
                          value={formData.duties}
                          onChange={(e) => setFormData({ ...formData, duties: e.target.value })}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }}
                        />
                      </div>
                    </>
                  )}

                  {/* Role Spesifik */}
                  {activeTab === 'role' && (
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Deskripsi Hak Akses / Wewenang
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Uraian hak akses sistem dan cakupan wewenang..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }}
                      />
                    </div>
                  )}

                  {/* Station Spesifik */}
                  {activeTab === 'station' && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '14px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            Kode Mako <span style={{ color: 'red' }}>*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: POLSEK-KBY-BARU"
                            value={formData.station_code}
                            onChange={(e) => setFormData({ ...formData, station_code: e.target.value })}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', fontFamily: 'monospace', fontWeight: 700, boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            Nama Markas Komando <span style={{ color: 'red' }}>*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: Polsek Metro Kebayoran Baru"
                            value={formData.station_name}
                            onChange={(e) => setFormData({ ...formData, station_name: e.target.value })}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            Tingkat Hierarki Mako
                          </label>
                          <select
                            value={formData.station_level}
                            onChange={(e) => setFormData({ ...formData, station_level: e.target.value })}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }}
                          >
                            <option value="POLSEK">Polsek (Sektor)</option>
                            <option value="POLRES">Polres (Resor)</option>
                            <option value="POLDA">Polda (Daerah)</option>
                            <option value="POSPOL">Pos Polisi / Pos Lantas</option>
                            <option value="MABES">Mabes Polri</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            Radius Geofence (Meter)
                          </label>
                          <input
                            type="number"
                            value={formData.geofence_radius_meters}
                            onChange={(e) => setFormData({ ...formData, geofence_radius_meters: parseInt(e.target.value) || 500 })}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          Alamat Lengkap Mako <span style={{ color: 'red' }}>*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Jl. Wijaya II No. 42, Kebayoran Baru, Jakarta Selatan"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            Latitude Mako
                          </label>
                          <input
                            type="number"
                            step="0.00000001"
                            value={formData.office_lat}
                            onChange={(e) => setFormData({ ...formData, office_lat: parseFloat(e.target.value) || 0 })}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            Longitude Mako
                          </label>
                          <input
                            type="number"
                            step="0.00000001"
                            value={formData.office_lng}
                            onChange={(e) => setFormData({ ...formData, office_lng: parseFloat(e.target.value) || 0 })}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Urutan Tampilan & Status Aktif */}
                  {activeTab !== 'station' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          Urutan Tampilan
                        </label>
                        <input
                          type="number"
                          value={formData.display_order}
                          onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          Status Keaktifan
                        </label>
                        <select
                          value={formData.is_active ? '1' : '0'}
                          onChange={(e) => setFormData({ ...formData, is_active: e.target.value === '1' })}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }}
                        >
                          <option value="1">✓ Aktif Digunakan</option>
                          <option value="0">✕ Nonaktifkan</option>
                        </select>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
                <button
                  type="button"
                  disabled={formSubmitting}
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    background: '#F8FAFC',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: '#64748B',
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #153E75 0%, #2563EB 100%)',
                    fontSize: '12.5px',
                    fontWeight: 800,
                    color: 'white',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
                  }}
                >
                  {formSubmitting ? 'Menyimpan...' : modalMode === 'add' ? 'Simpan Data' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
