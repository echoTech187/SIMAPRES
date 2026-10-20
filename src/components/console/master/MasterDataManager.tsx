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
  getMasterStationLevelsAction,
  createPoliceStationMasterAction,
  updatePoliceStationMasterAction,
  deletePoliceStationMasterAction,
  getMasterIncidentCategoriesAction,
  createMasterIncidentCategoryAction,
  updateMasterIncidentCategoryAction,
  deleteMasterIncidentCategoryAction,
  getMasterIncidentSubcategoriesAction,
  getMasterUrgencyLevelsAction,
  createMasterIncidentSubcategoryAction,
  updateMasterIncidentSubcategoryAction,
  deleteMasterIncidentSubcategoryAction,
  getMasterHotspotCategoriesAction,
  createMasterHotspotCategoryAction,
  updateMasterHotspotCategoryAction,
  deleteMasterHotspotCategoryAction,
  getMasterHotspotDangerLevelsAction,
  getMasterHotspotsAction,
  createMasterHotspotAction,
  updateMasterHotspotAction,
  deleteMasterHotspotAction,
  getMasterVehiclesAction,
  getMasterVehicleTypesAction,
  getMasterVehicleStatusesAction,
  createMasterVehicleAction,
  updateMasterVehicleAction,
  deleteMasterVehicleAction,
  getMasterDutyStatusesAction,
  createMasterDutyStatusAction,
  updateMasterDutyStatusAction,
  deleteMasterDutyStatusAction,
  getMasterResolutionLocationsAction,
  createMasterResolutionLocationAction,
  updateMasterResolutionLocationAction,
  deleteMasterResolutionLocationAction,
  getMasterResolutionDocumentsAction,
  createMasterResolutionDocumentAction,
  updateMasterResolutionDocumentAction,
  deleteMasterResolutionDocumentAction,
} from '@/app/actions/master.actions';
import AddressLocationPicker from '@/components/common/AddressLocationPicker';

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
  | 'subkategori'
  | 'duty'
  | 'lokasi_penyelesaian'
  | 'dokumen_penyelesaian';

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

  // Dropdown options & Filter states
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [unitsList, setUnitsList] = useState<any[]>([]);
  const [hotspotCategoriesList, setHotspotCategoriesList] = useState<any[]>([]);
  const [dangerLevelsList, setDangerLevelsList] = useState<any[]>([]);
  const [stationLevelsList, setStationLevelsList] = useState<any[]>([]);
  const [urgencyLevelsList, setUrgencyLevelsList] = useState<any[]>([]);
  const [vehicleTypesList, setVehicleTypesList] = useState<any[]>([]);
  const [vehicleStatusesList, setVehicleStatusesList] = useState<any[]>([]);
  const [filterSubcatCategory, setFilterSubcatCategory] = useState<string>('all');
  const [filterSubcatUnit, setFilterSubcatUnit] = useState<string>('all');
  const [filterSubcatUrgensi, setFilterSubcatUrgensi] = useState<string>('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Khusus Titik Rawan GIS
  const [showMiniPickerRawan, setShowMiniPickerRawan] = useState(false);

  // Form Fields State - Murni kosong tanpa fallback/hardcode dummy
  const [formData, setFormData] = useState<any>({
    key: '',
    label: '',
    display_order: 1,
    is_active: true,
    // Satuan
    unit_name: '',
    short_name: '',
    icon_emoji: '',
    duties: '',
    default_orders: '',
    // Role
    description: '',
    // Station
    station_code: '',
    station_name: '',
    station_level: '',
    address: '',
    office_lat: 0,
    office_lng: 0,
    geofence_radius_meters: 0,
    // Armada Operasional
    nomor_lambung: '',
    nama_armada: '',
    jenis_kendaraan: '',
    plat_nomor_polisi: '',
    status_operasional: '',
    driver_officer_nrp: '',
    current_lat: 0,
    current_lng: 0,
    // Titik Rawan GIS
    title: '',
    police_sector: '',
    category: '',
    danger_level: '',
    lat: 0,
    lng: 0,
    active_start: '',
    active_end: '',
    schedule_display: '',
    nearest_unit: '',
    // Kategori & Status
    icon: '',
    badge_bg: '',
    badge_color: '',
    badge_border: '',
    // Subkategori
    nama_kasus: '',
    category_id: 0,
    category_key: '',
    unit_id: 0,
    unit_key: '',
    default_urgensi: '',
    deskripsi_sop: '',
    // Lokasi & Dokumen Penyelesaian Step 3
    keterangan: '',
    requires_strict_tkp: false,
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
          if (stationLevelsList.length === 0) {
            getMasterStationLevelsAction().then((slRes) => {
              if (slRes.success && slRes.data) setStationLevelsList(slRes.data);
            });
          }
          break;
        case 'armada':
          res = await getMasterVehiclesAction();
          if (vehicleTypesList.length === 0) {
            getMasterVehicleTypesAction().then((vtRes) => {
              if (vtRes.success && vtRes.data) setVehicleTypesList(vtRes.data);
            });
          }
          if (vehicleStatusesList.length === 0) {
            getMasterVehicleStatusesAction().then((vsRes) => {
              if (vsRes.success && vsRes.data) setVehicleStatusesList(vsRes.data);
            });
          }
          break;
        case 'hotspot':
          res = await getMasterHotspotsAction();
          if (hotspotCategoriesList.length === 0) {
            getMasterHotspotCategoriesAction().then((hcRes) => {
              if (hcRes.success && hcRes.data) setHotspotCategoriesList(hcRes.data);
            });
          }
          if (dangerLevelsList.length === 0) {
            getMasterHotspotDangerLevelsAction().then((dlRes) => {
              if (dlRes.success && dlRes.data) setDangerLevelsList(dlRes.data);
            });
          }
          break;
        case 'hotspot_cat':
          res = await getMasterHotspotCategoriesAction();
          break;
        case 'kategori':
          res = await getMasterIncidentCategoriesAction();
          break;
        case 'subkategori': {
          res = await getMasterIncidentSubcategoriesAction();
          // Muat referensi kategori & satuan jika belum ada
          if (categoriesList.length === 0) {
            getMasterIncidentCategoriesAction().then((cRes) => {
              if (cRes.success && cRes.data) setCategoriesList(cRes.data);
            });
          }
          if (unitsList.length === 0) {
            getMasterOperationalUnitsAction().then((uRes) => {
              if (uRes.success && uRes.data) setUnitsList(uRes.data);
            });
          }
          if (urgencyLevelsList.length === 0) {
            getMasterUrgencyLevelsAction().then((urgRes) => {
              if (urgRes.success && urgRes.data) setUrgencyLevelsList(urgRes.data);
            });
          }
          break;
        }
        case 'duty':
          res = await getMasterDutyStatusesAction();
          break;
        case 'lokasi_penyelesaian':
          res = await getMasterResolutionLocationsAction();
          break;
        case 'dokumen_penyelesaian':
          res = await getMasterResolutionDocumentsAction();
          break;
      }
      if (res && res.success && res.data) {
        setDataList(res.data);
      }
    } catch (err: any) {
      console.warn('Gagal memuat master data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Preload semua master lookup tables dari database
    getMasterStationLevelsAction().then((res) => {
      if (res.success && res.data) setStationLevelsList(res.data);
    });
    getMasterUrgencyLevelsAction().then((res) => {
      if (res.success && res.data) setUrgencyLevelsList(res.data);
    });
    getMasterVehicleTypesAction().then((res) => {
      if (res.success && res.data) setVehicleTypesList(res.data);
    });
    getMasterVehicleStatusesAction().then((res) => {
      if (res.success && res.data) setVehicleStatusesList(res.data);
    });
    getMasterHotspotDangerLevelsAction().then((res) => {
      if (res.success && res.data) setDangerLevelsList(res.data);
    });
    getMasterIncidentCategoriesAction().then((res) => {
      if (res.success && res.data) setCategoriesList(res.data);
    });
    getMasterOperationalUnitsAction().then((res) => {
      if (res.success && res.data) setUnitsList(res.data);
    });
    getMasterHotspotCategoriesAction().then((res) => {
      if (res.success && res.data) setHotspotCategoriesList(res.data);
    });
  }, []);

  useEffect(() => {
    setSearchQuery('');
    setFilterActive('all');
    setFilterSubcatCategory('all');
    setFilterSubcatUnit('all');
    setFilterSubcatUrgensi('all');
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
      icon_emoji: '',
      duties: '',
      default_orders: '',
      description: '',
      station_code: '',
      station_name: '',
      station_level: '',
      address: '',
      office_lat: 0,
      office_lng: 0,
      geofence_radius_meters: 0,
      nomor_lambung: '',
      nama_armada: '',
      jenis_kendaraan: '',
      plat_nomor_polisi: '',
      status_operasional: '',
      driver_officer_nrp: '',
      current_lat: 0,
      current_lng: 0,
      title: '',
      police_sector: '',
      category: '',
      danger_level: '',
      lat: 0,
      lng: 0,
      active_start: '',
      active_end: '',
      schedule_display: '',
      nearest_unit: '',
      icon: '',
      badge_bg: '',
      badge_color: '',
      badge_border: '',
      // Subkategori
      nama_kasus: '',
      category_id: 0,
      category_key: '',
      unit_id: 0,
      unit_key: '',
      default_urgensi: '',
      deskripsi_sop: '',
      // Lokasi & Dokumen
      keterangan: '',
      requires_strict_tkp: false,
    });
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: any) => {
    setModalMode('edit');
    setEditingId(item.id);
    setShowMiniPickerRawan(false);
    setFormData({
      key: item.key ?? item.station_code ?? item.nomor_lambung ?? '',
      label: item.label ?? item.station_name ?? item.unit_name ?? item.nama_armada ?? item.title ?? item.nama_kasus ?? '',
      display_order: item.display_order ?? 1,
      is_active: item.is_active !== undefined ? item.is_active : true,
      unit_name: item.unit_name ?? '',
      short_name: item.short_name ?? '',
      icon_emoji: item.icon_emoji ?? '',
      duties: item.duties ?? '',
      default_orders: item.default_orders ?? '',
      description: item.description ?? '',
      station_code: item.station_code ?? '',
      station_name: item.station_name ?? '',
      station_level: item.station_level ?? '',
      address: item.address ?? '',
      office_lat: item.office_lat != null ? Number(item.office_lat) : 0,
      office_lng: item.office_lng != null ? Number(item.office_lng) : 0,
      geofence_radius_meters: item.geofence_radius_meters != null ? Number(item.geofence_radius_meters) : 0,
      nomor_lambung: item.nomor_lambung ?? '',
      nama_armada: item.nama_armada ?? '',
      jenis_kendaraan: item.jenis_kendaraan ?? '',
      plat_nomor_polisi: item.plat_nomor_polisi ?? '',
      status_operasional: item.status_operasional ?? '',
      driver_officer_nrp: item.driver_officer_nrp ?? '',
      current_lat: item.current_lat != null ? Number(item.current_lat) : 0,
      current_lng: item.current_lng != null ? Number(item.current_lng) : 0,
      title: item.title ?? '',
      police_sector: item.police_sector ?? '',
      category: item.category ?? '',
      danger_level: item.danger_level ?? '',
      lat: item.lat != null ? Number(item.lat) : 0,
      lng: item.lng != null ? Number(item.lng) : 0,
      active_start: item.active_start ?? '',
      active_end: item.active_end ?? '',
      schedule_display: item.schedule_display ?? '',
      nearest_unit: item.nearest_unit ?? '',
      icon: item.icon ?? '',
      badge_bg: item.badge_bg ?? '',
      badge_color: item.badge_color ?? '',
      badge_border: item.badge_border ?? '',
      // Subkategori
      nama_kasus: item.nama_kasus ?? '',
      category_id: item.category_id ?? item.category_rel?.id ?? 0,
      category_key: item.category_key ?? item.category_rel?.key ?? '',
      unit_id: item.unit_id ?? item.unit_rel?.id ?? 0,
      unit_key: item.unit_key ?? item.unit_rel?.key ?? '',
      default_urgensi: item.default_urgensi ?? '',
      deskripsi_sop: item.deskripsi_sop ?? '',
      // Lokasi & Dokumen
      keterangan: item.keterangan || item.description || '',
      requires_strict_tkp: item.requires_strict_tkp !== undefined ? Boolean(item.requires_strict_tkp) : false,
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
            if (!formData.key?.trim() || !formData.label?.trim()) {
              alert('Kode Pangkat dan Label wajib diisi!');
              setFormSubmitting(false);
              return;
            }
            res = await createMasterRankAction(formData);
            break;
          case 'satuan':
            if (!formData.key?.trim() || !formData.unit_name?.trim()) {
              alert('Kode Satuan dan Nama Satuan wajib diisi!');
              setFormSubmitting(false);
              return;
            }
            res = await createMasterOperationalUnitAction(formData);
            break;
          case 'role':
            if (!formData.key?.trim() || !formData.label?.trim()) {
              alert('Kode Role dan Label wajib diisi!');
              setFormSubmitting(false);
              return;
            }
            res = await createMasterRoleAction(formData);
            break;
          case 'station':
            if (!formData.station_code?.trim() || !formData.station_name?.trim() || !formData.station_level?.trim() || !formData.address?.trim()) {
              alert('Kode Mako, Nama Mako, Tingkat Hierarki, dan Alamat Mako wajib diisi!');
              setFormSubmitting(false);
              return;
            }
            res = await createPoliceStationMasterAction(formData);
            break;
          case 'armada':
            if (!formData.nomor_lambung?.trim() || !formData.nama_armada?.trim() || !formData.jenis_kendaraan?.trim() || !formData.status_operasional?.trim()) {
              alert('Nomor Lambung, Nama Armada, Jenis Kendaraan, dan Status Operasional wajib diisi!');
              setFormSubmitting(false);
              return;
            }
            res = await createMasterVehicleAction(formData);
            break;
          case 'hotspot': {
            const cleanKey = formData.key?.trim();
            if (!cleanKey) {
              alert('Kode Titik Rawan wajib diisi!');
              setFormSubmitting(false);
              return;
            }
            if (!formData.title?.trim()) {
              alert('Nama Titik Rawan wajib diisi!');
              setFormSubmitting(false);
              return;
            }
            if (!formData.police_sector?.trim()) {
              alert('Wilayah / Polsek Pengampu wajib diisi!');
              setFormSubmitting(false);
              return;
            }
            if (!formData.category?.trim()) {
              alert('Kategori Kerawanan wajib dipilih!');
              setFormSubmitting(false);
              return;
            }
            if (!formData.danger_level?.trim()) {
              alert('Tingkat Status Bahaya wajib dipilih!');
              setFormSubmitting(false);
              return;
            }
            if (!formData.schedule_display?.trim()) {
              alert('Jadwal / Jam Rawan wajib diisi!');
              setFormSubmitting(false);
              return;
            }
            if (!formData.nearest_unit?.trim()) {
              alert('Unit Terdekat / PIC Lapangan wajib diisi!');
              setFormSubmitting(false);
              return;
            }
            res = await createMasterHotspotAction({
              ...formData,
              key: cleanKey,
            });
            break;
          }
          case 'hotspot_cat':
            if (!formData.key?.trim() || !formData.label?.trim()) {
              alert('Kode dan Label Kategori Titik Rawan wajib diisi!');
              setFormSubmitting(false);
              return;
            }
            res = await createMasterHotspotCategoryAction(formData);
            break;
          case 'kategori':
            if (
              !formData.key?.trim() ||
              !formData.label?.trim() ||
              !formData.icon?.trim() ||
              !formData.badge_bg?.trim() ||
              !formData.badge_color?.trim() ||
              !formData.badge_border?.trim()
            ) {
              alert('Kode, Label, Icon Emoji, dan Warna Badge wajib diisi lengkap!');
              setFormSubmitting(false);
              return;
            }
            res = await createMasterIncidentCategoryAction(formData);
            break;
          case 'subkategori': {
            const cleanKasus = formData.nama_kasus?.trim();
            if (!cleanKasus) {
              alert('Nama kasus/subkategori wajib diisi!');
              setFormSubmitting(false);
              return;
            }
            const cat = categoriesList.find((c) => c.key === formData.category_key || c.id === Number(formData.category_id));
            if (!cat) {
              alert('Kategori Induk Kejadian wajib dipilih!');
              setFormSubmitting(false);
              return;
            }
            const unit = unitsList.find((u) => u.key?.toLowerCase() === formData.unit_key?.toLowerCase() || u.id === Number(formData.unit_id));
            if (!unit) {
              alert('Satuan Unit Utama (SOP) wajib dipilih!');
              setFormSubmitting(false);
              return;
            }
            if (!formData.default_urgensi?.trim()) {
              alert('Default Tingkat Urgensi Presisi wajib dipilih!');
              setFormSubmitting(false);
              return;
            }
            res = await createMasterIncidentSubcategoryAction({
              category_id: Number(cat.id),
              category_key: cat.key,
              unit_id: Number(unit.id),
              unit_key: unit.key,
              nama_kasus: cleanKasus,
              default_urgensi: formData.default_urgensi,
              deskripsi_sop: formData.deskripsi_sop?.trim() || '',
              display_order: Number(formData.display_order) || 1,
              is_active: Boolean(formData.is_active),
            });
            break;
          }
          case 'duty':
            if (!formData.key?.trim() || !formData.label?.trim()) {
              alert('Kode dan Label Status Kedinasan wajib diisi!');
              setFormSubmitting(false);
              return;
            }
            res = await createMasterDutyStatusAction(formData);
            break;
          case 'lokasi_penyelesaian':
            if (!formData.key?.trim() || !formData.label?.trim()) {
              alert('Kode dan Nama Lokasi Penyelesaian wajib diisi!');
              setFormSubmitting(false);
              return;
            }
            res = await createMasterResolutionLocationAction({
              key: formData.key.trim().toUpperCase(),
              label: formData.label.trim(),
              icon_emoji: formData.icon_emoji?.trim() || '📍',
              keterangan: formData.keterangan?.trim() || '',
              requires_strict_tkp: Boolean(formData.requires_strict_tkp),
              badge_bg: formData.badge_bg?.trim() || '',
              badge_color: formData.badge_color?.trim() || '',
              display_order: Number(formData.display_order) || 1,
              is_active: Boolean(formData.is_active),
            });
            break;
          case 'dokumen_penyelesaian':
            if (!formData.key?.trim() || !formData.label?.trim()) {
              alert('Kode dan Nama Jenis Dokumen Bukti wajib diisi!');
              setFormSubmitting(false);
              return;
            }
            res = await createMasterResolutionDocumentAction({
              key: formData.key.trim().toUpperCase(),
              label: formData.label.trim(),
              icon_emoji: formData.icon_emoji?.trim() || '📄',
              keterangan: formData.keterangan?.trim() || '',
              badge_bg: formData.badge_bg?.trim() || '',
              badge_color: formData.badge_color?.trim() || '',
              display_order: Number(formData.display_order) || 1,
              is_active: Boolean(formData.is_active),
            });
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
          case 'subkategori': {
            const cleanKasus = formData.nama_kasus?.trim();
            if (!cleanKasus) {
              alert('Nama kasus/subkategori wajib diisi!');
              setFormSubmitting(false);
              return;
            }
            const cat = categoriesList.find((c) => c.key === formData.category_key || c.id === Number(formData.category_id));
            if (!cat) {
              alert('Kategori Induk Kejadian wajib dipilih!');
              setFormSubmitting(false);
              return;
            }
            const unit = unitsList.find((u) => u.key?.toLowerCase() === formData.unit_key?.toLowerCase() || u.id === Number(formData.unit_id));
            if (!unit) {
              alert('Satuan Unit Utama (SOP) wajib dipilih!');
              setFormSubmitting(false);
              return;
            }
            if (!formData.default_urgensi?.trim()) {
              alert('Default Tingkat Urgensi Presisi wajib dipilih!');
              setFormSubmitting(false);
              return;
            }
            res = await updateMasterIncidentSubcategoryAction(Number(editingId), {
              category_id: Number(cat.id),
              category_key: cat.key,
              unit_id: Number(unit.id),
              unit_key: unit.key,
              nama_kasus: cleanKasus,
              default_urgensi: formData.default_urgensi,
              deskripsi_sop: formData.deskripsi_sop?.trim() || '',
              display_order: Number(formData.display_order) || 1,
              is_active: Boolean(formData.is_active),
            });
            break;
          }
          case 'duty':
            res = await updateMasterDutyStatusAction(Number(editingId), formData);
            break;
          case 'lokasi_penyelesaian':
            res = await updateMasterResolutionLocationAction(Number(editingId), {
              key: formData.key?.trim().toUpperCase(),
              label: formData.label?.trim(),
              icon_emoji: formData.icon_emoji?.trim() || '📍',
              keterangan: formData.keterangan?.trim() || '',
              requires_strict_tkp: Boolean(formData.requires_strict_tkp),
              badge_bg: formData.badge_bg?.trim() || '',
              badge_color: formData.badge_color?.trim() || '',
              display_order: Number(formData.display_order) || 1,
              is_active: Boolean(formData.is_active),
            });
            break;
          case 'dokumen_penyelesaian':
            res = await updateMasterResolutionDocumentAction(Number(editingId), {
              key: formData.key?.trim().toUpperCase(),
              label: formData.label?.trim(),
              icon_emoji: formData.icon_emoji?.trim() || '📄',
              keterangan: formData.keterangan?.trim() || '',
              badge_bg: formData.badge_bg?.trim() || '',
              badge_color: formData.badge_color?.trim() || '',
              display_order: Number(formData.display_order) || 1,
              is_active: Boolean(formData.is_active),
            });
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
    if (!confirm(`Hapus data master "${label}"? Tindakan ini permanen di database SIMOPMAS 110.`)) {
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
        case 'subkategori':
          res = await deleteMasterIncidentSubcategoryAction(Number(id));
          break;
        case 'duty':
          res = await deleteMasterDutyStatusAction(Number(id));
          break;
        case 'lokasi_penyelesaian':
          res = await deleteMasterResolutionLocationAction(Number(id));
          break;
        case 'dokumen_penyelesaian':
          res = await deleteMasterResolutionDocumentAction(Number(id));
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
      (item.address && item.address.toLowerCase().includes(q)) ||
      (item.nama_kasus && item.nama_kasus.toLowerCase().includes(q)) ||
      (item.category_key && item.category_key.toLowerCase().includes(q)) ||
      (item.category_rel?.label && item.category_rel.label.toLowerCase().includes(q)) ||
      (item.unit_key && item.unit_key.toLowerCase().includes(q)) ||
      (item.unit_rel?.short_name && item.unit_rel.short_name.toLowerCase().includes(q)) ||
      (item.unit_rel?.unit_name && item.unit_rel.unit_name.toLowerCase().includes(q)) ||
      (item.deskripsi_sop && item.deskripsi_sop.toLowerCase().includes(q)) ||
      (item.keterangan && item.keterangan.toLowerCase().includes(q)) ||
      (item.default_urgensi && item.default_urgensi.toLowerCase().includes(q));

    if (!matchQuery) return false;

    if (activeTab === 'subkategori') {
      if (filterSubcatCategory !== 'all' && item.category_key !== filterSubcatCategory) return false;
      if (filterSubcatUnit !== 'all' && item.unit_key?.toLowerCase() !== filterSubcatUnit.toLowerCase()) return false;
      if (filterSubcatUrgensi !== 'all' && item.default_urgensi !== filterSubcatUrgensi) return false;
    }

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
      case 'subkategori':
        return {
          title: 'Master Subkategori Insiden & Rincian Kasus (Presisi CAD)',
          desc: 'Pangkalan data rincian kasus kejahatan, lakalantas, dan kamtibmas terintegrasi SOP penanganan taktis serta satuan penanggung jawab.',
          addBtn: 'Tambah Subkategori Kasus',
          icon: '📑',
        };
      case 'duty':
        return {
          title: 'Master Status Kedinasan Personel',
          desc: 'Daftar status kedinasan siaga personel (Dinas Patroli, Piket SPKT, Cadangan, Lepas Dinas, BKO).',
          addBtn: 'Tambah Status Tugas',
          icon: '📋',
        };
      case 'lokasi_penyelesaian':
        return {
          title: 'Master Lokasi Penyelesaian Perkara',
          desc: 'Konfigurasi jenis lokasi penyelesaian laporan laka/insiden (TKP, Rumah Sakit/Faskes, Kantor Polisi/Polsek/Unit Laka, Kantor Kelurahan, dll.) dengan status toleransi geofence GPS.',
          addBtn: 'Tambah Lokasi Penyelesaian',
          icon: '📍',
        };
      case 'dokumen_penyelesaian':
        return {
          title: 'Master Objek & Dokumen Bukti Penyelesaian (Step 3)',
          desc: 'Klasifikasi objek dokumentasi kamera Step 3 (Surat Pernyataan Damai / BAP Mediasi bermaterai, Rekam Medis / Rujukan RS, Penyerahan Barang Bukti, Situasi Kondusif Para Pihak, dll.).',
          addBtn: 'Tambah Jenis Dokumen',
          icon: '📄',
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

        {/* Filter Tambahan Khusus Subkategori */}
        {activeTab === 'subkategori' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Kategori:</span>
              <select
                value={filterSubcatCategory}
                onChange={(e) => setFilterSubcatCategory(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#334155',
                  outline: 'none',
                  cursor: 'pointer',
                  maxWidth: '180px',
                }}
              >
                <option value="all">Semua Kategori</option>
                {categoriesList.map((cat) => (
                  <option key={cat.id} value={cat.key}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Satuan SOP:</span>
              <select
                value={filterSubcatUnit}
                onChange={(e) => setFilterSubcatUnit(e.target.value)}
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
                <option value="all">Semua Satuan</option>
                {unitsList.map((unit) => (
                  <option key={unit.id} value={unit.key}>
                    {unit.icon_emoji} {unit.short_name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Urgensi:</span>
              <select
                value={filterSubcatUrgensi}
                onChange={(e) => setFilterSubcatUrgensi(e.target.value)}
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
                <option value="all">Semua Urgensi</option>
                {urgencyLevelsList.map((urg) => (
                  <option key={urg.id || urg.key} value={urg.key}>
                    {urg.icon_emoji ? `${urg.icon_emoji} ` : ''}{urg.label}
                  </option>
                ))}
              </select>
            </div>
          </>
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
                
                {activeTab === 'subkategori' ? (
                  <>
                    <th style={{ padding: '12px 16px' }}>RINCIAN KASUS / SUBKATEGORI</th>
                    <th style={{ padding: '12px 16px' }}>KATEGORI INDUK</th>
                    <th style={{ padding: '12px 16px' }}>SATUAN UTAMA (SOP)</th>
                    <th style={{ padding: '12px 16px' }}>STANDAR SOP PENANGANAN TAKTIS</th>
                    <th style={{ padding: '12px 16px', width: '80px' }}>URUTAN</th>
                    <th style={{ padding: '12px 16px', width: '90px' }}>STATUS</th>
                  </>
                ) : activeTab === 'armada' ? (
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
                ) : activeTab === 'lokasi_penyelesaian' ? (
                  <>
                    <th style={{ padding: '12px 16px' }}>KODE / KEY</th>
                    <th style={{ padding: '12px 16px' }}>LOKASI PENYELESAIAN</th>
                    <th style={{ padding: '12px 16px' }}>KETERANGAN &amp; LINGKUP</th>
                    <th style={{ padding: '12px 16px' }}>VALIDASI TKP GEOFENCE</th>
                    <th style={{ padding: '12px 16px' }}>BADGE WATERMARK</th>
                    <th style={{ padding: '12px 16px', width: '90px' }}>URUTAN</th>
                    <th style={{ padding: '12px 16px', width: '100px' }}>STATUS</th>
                  </>
                ) : activeTab === 'dokumen_penyelesaian' ? (
                  <>
                    <th style={{ padding: '12px 16px' }}>KODE / KEY</th>
                    <th style={{ padding: '12px 16px' }}>JENIS OBJEK DOKUMEN</th>
                    <th style={{ padding: '12px 16px' }}>KETERANGAN &amp; FUNGSI BUKTI</th>
                    <th style={{ padding: '12px 16px' }}>BADGE WATERMARK</th>
                    <th style={{ padding: '12px 16px', width: '90px' }}>URUTAN</th>
                    <th style={{ padding: '12px 16px', width: '100px' }}>STATUS</th>
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
                            {item.plat_nomor_polisi}
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
                          {item.driver_officer_nrp}
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
                          {item.schedule_display ? (
                            <div style={{ fontWeight: 700, color: '#D97706' }}>🕒 {item.schedule_display}</div>
                          ) : item.active_start && item.active_end ? (
                            <div style={{ fontWeight: 700, color: '#D97706' }}>🕒 {item.active_start} - {item.active_end} WIB</div>
                          ) : null}
                          {item.nearest_unit ? (
                            <div style={{ fontSize: '11px', color: '#64748B' }}>🚔 {item.nearest_unit}</div>
                          ) : null}
                        </td>
                      </>
                    ) : activeTab === 'subkategori' ? (
                      /* BARIS KHUSUS SUBKATEGORI INSIDEN */
                      <>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '13px', marginBottom: '4px' }}>
                            {item.nama_kasus}
                          </div>
                          {item.default_urgensi ? (() => {
                            const urg = item.default_urgensi;
                            const isDarurat = urg === 'DARURAT' || urg === 'PRIORITAS_TINGGI';
                            const isSedang = urg === 'SEDANG';
                            const bg = isDarurat ? '#FEE2E2' : isSedang ? '#FEF3C7' : '#EFF6FF';
                            const text = isDarurat ? '#DC2626' : isSedang ? '#D97706' : '#1D4ED8';
                            const icon = isDarurat ? '🚨' : isSedang ? '⚠️' : 'ℹ️';
                            return (
                              <span
                                style={{
                                  fontSize: '10.5px',
                                  fontWeight: 800,
                                  padding: '2px 7px',
                                  borderRadius: '4px',
                                  background: bg,
                                  color: text,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <span>{icon}</span> {isDarurat ? 'DARURAT' : urg}
                              </span>
                            );
                          })() : null}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {(item.category_rel?.label || item.category_key) && (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                background: item.category_rel?.badge_bg || '#F8FAFC',
                                color: item.category_rel?.badge_color || '#1E293B',
                                border: item.category_rel?.badge_border ? `1px solid ${item.category_rel.badge_border}` : '1px solid #E2E8F0',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}
                            >
                              {item.category_rel?.icon ? <span>{item.category_rel.icon}</span> : null}
                              <span>{item.category_rel?.label || item.category_key}</span>
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {(item.unit_rel?.short_name || item.unit_key) && (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                background: '#F8FAFC',
                                color: '#0F172A',
                                border: '1px solid #E2E8F0',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              {item.unit_rel?.icon_emoji ? <span>{item.unit_rel.icon_emoji}</span> : null}
                              <span>{item.unit_rel?.short_name || item.unit_key?.toUpperCase()}</span>
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', maxWidth: '300px', fontSize: '11.5px', color: '#475569', lineHeight: 1.4 }}>
                          {item.deskripsi_sop ? (
                            <span title={item.deskripsi_sop}>{item.deskripsi_sop}</span>
                          ) : (
                            <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Belum ada arahan SOP taktis</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#64748B' }}>
                          {item.display_order ?? 1}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '12px',
                              background: item.is_active ? '#DCFCE7' : '#F1F5F9',
                              color: item.is_active ? '#15803D' : '#64748B',
                            }}
                          >
                            {item.is_active ? '● AKTIF' : '○ NONAKTIF'}
                          </span>
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
                          {item.icon_emoji ? `${item.icon_emoji} ` : ''}
                          {item.label || item.station_name || item.unit_name}
                        </td>

                        {/* Kolom Spesifik Lokasi Penyelesaian */}
                        {activeTab === 'lokasi_penyelesaian' && (
                          <>
                            <td style={{ padding: '14px 16px', color: '#475569', fontSize: '12px', maxWidth: '320px' }}>
                              {item.keterangan || '-'}
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              {item.requires_strict_tkp ? (
                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    padding: '3px 8px',
                                    borderRadius: '12px',
                                    background: '#FEF2F2',
                                    color: '#DC2626',
                                    border: '1px solid #FECACA',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <span>🔒</span> Wajib TKP (≤100m)
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    padding: '3px 8px',
                                    borderRadius: '12px',
                                    background: '#ECFDF5',
                                    color: '#059669',
                                    border: '1px solid #A7F3D0',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <span>🌐</span> Fleksibel (RS/Polsek)
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span
                                style={{
                                  background: item.badge_bg || '#EFF6FF',
                                  color: item.badge_color || '#1D4ED8',
                                  border: item.badge_border ? `1px solid ${item.badge_border}` : '1px solid #BFDBFE',
                                  padding: '3px 8px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                }}
                              >
                                {item.icon_emoji} {item.label}
                              </span>
                            </td>
                          </>
                        )}

                        {/* Kolom Spesifik Dokumen Penyelesaian */}
                        {activeTab === 'dokumen_penyelesaian' && (
                          <>
                            <td style={{ padding: '14px 16px', color: '#475569', fontSize: '12px', maxWidth: '340px' }}>
                              {item.keterangan || '-'}
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span
                                style={{
                                  background: item.badge_bg || '#F8FAFC',
                                  color: item.badge_color || '#0F172A',
                                  border: item.badge_border ? `1px solid ${item.badge_border}` : '1px solid #CBD5E1',
                                  padding: '3px 8px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                }}
                              >
                                {item.icon_emoji} {item.label}
                              </span>
                            </td>
                          </>
                        )}

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
                            {item.description}
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
                                background: item.badge_bg || '#F8FAFC',
                                color: item.badge_color || '#334155',
                                border: item.badge_color ? '1px solid currentColor' : '1px solid #E2E8F0',
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
                            {item.display_order ?? 1}
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
                            item.nama_kasus || item.label || item.station_name || item.unit_name || item.nama_armada || item.title || item.key
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
                  {/* Grid 3 Kolom Baris 1: Kode Rawan, Cari Alamat / Lokasi Rawan & Wilayah / Polsek Pengampu */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Kode Titik Rawan <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: HS-BARITO-01"
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
                          background: 'white',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
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
                        required
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
                        <option value="">-- Pilih Kategori Kerawanan --</option>
                        {hotspotCategoriesList.map((hc) => (
                          <option key={hc.id} value={hc.key}>
                            {hc.icon_emoji ? `${hc.icon_emoji} ` : ''}{hc.label} ({hc.key})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Tingkat Status Bahaya <span style={{ color: 'red' }}>*</span>
                      </label>
                      <select
                        required
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
                        <option value="">-- Pilih Tingkat Bahaya --</option>
                        {dangerLevelsList.map((dl) => (
                          <option key={dl.id || dl.key} value={dl.key}>
                            {dl.icon_emoji ? `${dl.icon_emoji} ` : ''}{dl.label?.includes(dl.key) ? dl.label : `${dl.label} (${dl.key})`}
                          </option>
                        ))}
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

                  {/* Koordinat GPS & Peta Interaktif (Lat/Lng Tersembunyi Otomatis) */}
                  <AddressLocationPicker
                    label="Pilih Titik Lokasi Rawan (Peta &amp; GPS)"
                    required={false}
                    placeholder="Ketik alamat jalan atau cari nama lokasi rawan..."
                    value={formData.title}
                    lat={formData.lat}
                    lng={formData.lng}
                    onChangeAddress={(newAddress) => {
                      setFormData((prev: any) => ({ ...prev, title: newAddress }));
                    }}
                    onChangeCoords={(newLat, newLng) => {
                      setFormData((prev: any) => ({ ...prev, lat: newLat, lng: newLng }));
                    }}
                    mapHeight="230px"
                  />

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
                        Jenis Kendaraan <span style={{ color: 'red' }}>*</span>
                      </label>
                      <select
                        required
                        value={formData.jenis_kendaraan}
                        onChange={(e) => setFormData({ ...formData, jenis_kendaraan: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }}
                      >
                        <option value="">-- Pilih Jenis Kendaraan --</option>
                        {vehicleTypesList.map((vt) => (
                          <option key={vt.key} value={vt.key}>
                            {vt.label}
                          </option>
                        ))}
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
                        Status Kesiapsiagaan <span style={{ color: 'red' }}>*</span>
                      </label>
                      <select
                        required
                        value={formData.status_operasional}
                        onChange={(e) => setFormData({ ...formData, status_operasional: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }}
                      >
                        <option value="">-- Pilih Status Operasional --</option>
                        {vehicleStatusesList.map((vs) => (
                          <option key={vs.key} value={vs.key}>
                            {vs.label}
                          </option>
                        ))}
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
              ) : activeTab === 'subkategori' ? (
                /* FORM FIELDS KHUSUS SUBKATEGORI INSIDEN */
                <>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Nama Rincian Kasus / Subkategori Insiden <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Pencurian dengan Pemberatan (Curat)"
                      value={formData.nama_kasus || ''}
                      onChange={(e) => setFormData({ ...formData, nama_kasus: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 600, boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Kategori Induk Kejadian <span style={{ color: 'red' }}>*</span>
                      </label>
                      <select
                        required
                        value={formData.category_key || ''}
                        onChange={(e) => {
                          const selectedCat = categoriesList.find((c) => c.key === e.target.value);
                          setFormData({
                            ...formData,
                            category_key: e.target.value,
                            category_id: selectedCat?.id || 0,
                          });
                        }}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }}
                      >
                        <option value="">-- Pilih Kategori Induk Kejadian --</option>
                        {categoriesList.map((cat) => (
                          <option key={cat.id} value={cat.key}>
                            {cat.icon} {cat.label} ({cat.key})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Satuan Unit Utama (SOP) <span style={{ color: 'red' }}>*</span>
                      </label>
                      <select
                        required
                        value={formData.unit_key || ''}
                        onChange={(e) => {
                          const selectedUnit = unitsList.find((u) => u.key?.toLowerCase() === e.target.value?.toLowerCase());
                          setFormData({
                            ...formData,
                            unit_key: e.target.value,
                            unit_id: selectedUnit?.id || 0,
                          });
                        }}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }}
                      >
                        <option value="">-- Pilih Satuan Unit Utama --</option>
                        {unitsList.map((unit) => (
                          <option key={unit.id} value={unit.key}>
                            {unit.icon_emoji} {unit.short_name} ({unit.unit_name})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Default Tingkat Urgensi Presisi <span style={{ color: 'red' }}>*</span>
                    </label>
                    <select
                      required
                      value={formData.default_urgensi || ''}
                      onChange={(e) => setFormData({ ...formData, default_urgensi: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }}
                    >
                      <option value="">-- Pilih Tingkat Urgensi Presisi --</option>
                      {urgencyLevelsList.map((urg) => (
                        <option key={urg.id || urg.key} value={urg.key}>
                          {urg.icon_emoji ? `${urg.icon_emoji} ` : ''}{urg.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Standar SOP &amp; Arahan Penanganan Taktis Personel Lapangan
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Contoh: Pasang police line di TKP, amankan rekaman CCTV sekitar, interogasi saksi awal, dan identifikasi pelaku."
                      value={formData.deskripsi_sop || ''}
                      onChange={(e) => setFormData({ ...formData, deskripsi_sop: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box', resize: 'vertical' }}
                    />
                  </div>

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

                  {/* Kategori Kejadian Spesifik */}
                  {activeTab === 'kategori' && (
                    <>
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          Icon Emoji Kategori <span style={{ color: 'red' }}>*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: 🚨 / ⚔️ / 🏍️"
                          value={formData.icon || ''}
                          onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            Warna Latar (Badge) <span style={{ color: 'red' }}>*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="#EFF6FF"
                            value={formData.badge_bg || ''}
                            onChange={(e) => setFormData({ ...formData, badge_bg: e.target.value })}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            Warna Teks <span style={{ color: 'red' }}>*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="#1D4ED8"
                            value={formData.badge_color || ''}
                            onChange={(e) => setFormData({ ...formData, badge_color: e.target.value })}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            Warna Border <span style={{ color: 'red' }}>*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="#BFDBFE"
                            value={formData.badge_border || ''}
                            onChange={(e) => setFormData({ ...formData, badge_border: e.target.value })}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Status Kedinasan Spesifik */}
                  {activeTab === 'duty' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          Warna Badge Teks
                        </label>
                        <input
                          type="text"
                          placeholder="#10B981"
                          value={formData.badge_color || ''}
                          onChange={(e) => setFormData({ ...formData, badge_color: e.target.value })}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          Warna Badge Latar
                        </label>
                        <input
                          type="text"
                          placeholder="#ECFDF5"
                          value={formData.badge_bg || ''}
                          onChange={(e) => setFormData({ ...formData, badge_bg: e.target.value })}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Kategori Titik Rawan Spesifik */}
                  {activeTab === 'hotspot_cat' && (
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Icon Emoji Kategori Rawan
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 🔴 / ⚠️ / 🏍️"
                        value={formData.icon_emoji || ''}
                        onChange={(e) => setFormData({ ...formData, icon_emoji: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                  )}

                  {/* Lokasi Penyelesaian Spesifik */}
                  {activeTab === 'lokasi_penyelesaian' && (
                    <>
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          Icon / Emoji Lokasi
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: 🏥 / 🏢 / 📍 / 🏛️"
                          value={formData.icon_emoji || ''}
                          onChange={(e) => setFormData({ ...formData, icon_emoji: e.target.value })}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          Keterangan &amp; Ruang Lingkup Penyelesaian
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Contoh: IGD Rumah Sakit / Faskes berupa pengecekan visum, rekam medis korban laka, dan mediasi damai keluarga..."
                          value={formData.keterangan || ''}
                          onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          Status Validasi Geofence TKP (Kamera Watermark) <span style={{ color: 'red' }}>*</span>
                        </label>
                        <select
                          value={formData.requires_strict_tkp ? '1' : '0'}
                          onChange={(e) => setFormData({ ...formData, requires_strict_tkp: e.target.value === '1' })}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', fontWeight: 600, boxSizing: 'border-box' }}
                        >
                          <option value="0">🌐 Fleksibel (Non-TKP: RS, Polsek, Mediasi Luar - Bebas Anomali GPS TKP)</option>
                          <option value="1">🔒 Wajib Radius TKP (Harus berada ≤ 100m dari koordinat TKP)</option>
                        </select>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                          Jika disetel fleksibel, personil dapat mengambil foto sah di Rumah Sakit atau Polsek tanpa dicatat anomali GPS TKP.
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            Warna Latar Badge
                          </label>
                          <input
                            type="text"
                            placeholder="#EFF6FF"
                            value={formData.badge_bg || ''}
                            onChange={(e) => setFormData({ ...formData, badge_bg: e.target.value })}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            Warna Teks Badge
                          </label>
                          <input
                            type="text"
                            placeholder="#1D4ED8"
                            value={formData.badge_color || ''}
                            onChange={(e) => setFormData({ ...formData, badge_color: e.target.value })}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            Warna Border
                          </label>
                          <input
                            type="text"
                            placeholder="#BFDBFE"
                            value={formData.badge_border || ''}
                            onChange={(e) => setFormData({ ...formData, badge_border: e.target.value })}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Dokumen Penyelesaian Spesifik */}
                  {activeTab === 'dokumen_penyelesaian' && (
                    <>
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          Icon / Emoji Dokumen
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: 📜 / 🩺 / 🤝 / 📄"
                          value={formData.icon_emoji || ''}
                          onChange={(e) => setFormData({ ...formData, icon_emoji: e.target.value })}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          Keterangan &amp; Petunjuk Objek Bukti
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Contoh: Foto fisik Surat Pernyataan Damai / BAP Mediasi bermaterai yang ditandatangani kedua belah pihak..."
                          value={formData.keterangan || ''}
                          onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            Warna Latar Badge
                          </label>
                          <input
                            type="text"
                            placeholder="#F8FAFC"
                            value={formData.badge_bg || ''}
                            onChange={(e) => setFormData({ ...formData, badge_bg: e.target.value })}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            Warna Teks Badge
                          </label>
                          <input
                            type="text"
                            placeholder="#0F172A"
                            value={formData.badge_color || ''}
                            onChange={(e) => setFormData({ ...formData, badge_color: e.target.value })}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            Warna Border
                          </label>
                          <input
                            type="text"
                            placeholder="#CBD5E1"
                            value={formData.badge_border || ''}
                            onChange={(e) => setFormData({ ...formData, badge_border: e.target.value })}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                    </>
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
                            Tingkat Hierarki Mako <span style={{ color: 'red' }}>*</span>
                          </label>
                          <select
                            required
                            value={formData.station_level}
                            onChange={(e) => setFormData({ ...formData, station_level: e.target.value })}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }}
                          >
                            <option value="">-- Pilih Tingkat Hierarki --</option>
                            {stationLevelsList.map((sl) => (
                              <option key={sl.id || sl.key} value={sl.key}>
                                {sl.label} ({sl.key})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            Radius Geofence (Meter)
                          </label>
                          <input
                            type="number"
                            min="10"
                            placeholder="Contoh: 500"
                            value={formData.geofence_radius_meters || ''}
                            onChange={(e) => setFormData({ ...formData, geofence_radius_meters: parseInt(e.target.value) || 0 })}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                      <AddressLocationPicker
                        label="Alamat Lengkap Mako"
                        required={true}
                        placeholder="Contoh: Jl. Wijaya II No. 42, Kebayoran Baru, Jakarta Selatan"
                        value={formData.address || ''}
                        lat={formData.office_lat || 0}
                        lng={formData.office_lng || 0}
                        onChangeAddress={(newAddr) => setFormData((prev: any) => ({ ...prev, address: newAddr }))}
                        onChangeCoords={(newLat, newLng) => setFormData((prev: any) => ({ ...prev, office_lat: newLat, office_lng: newLng }))}
                        mapHeight="230px"
                      />
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
