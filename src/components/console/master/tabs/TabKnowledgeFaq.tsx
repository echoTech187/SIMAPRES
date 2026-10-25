'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  getAllMasterFaqsAction,
  createMasterFaqAction,
  updateMasterFaqAction,
  deleteMasterFaqAction,
  toggleMasterFaqStatusAction,
  getMasterFaqCategoriesAction,
  createMasterFaqCategoryAction,
  updateMasterFaqCategoryAction,
  deleteMasterFaqCategoryAction,
} from '@/app/actions/knowledge.actions';
import { MasterTabProps } from './types';
import MasterTabShell from './MasterTabShell';
import Select2CustomDropdown from '@/components/ui/Select2CustomDropdown';

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function TabKnowledgeFaq({ lookups, showToast, onRefreshDropdowns }: MasterTabProps) {
  // Sub-tab: 'faq' (Daftar SOP & FAQ) atau 'category' (Master Kategori Layanan)
  const [subTab, setSubTab] = useState<'faq' | 'category'>('faq');

  // ── 1. STATE & HANDLERS MASTER FAQ / SOP ──
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ── 2. STATE & HANDLERS MASTER KATEGORI (DINAMIS DARI DATABASE) ──
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [catLoading, setCatLoading] = useState(true);

  const loadCategories = async () => {
    setCatLoading(true);
    try {
      const res = await getMasterFaqCategoriesAction();
      if (res?.success && Array.isArray(res.data)) {
        const normalized = res.data.map((c: any) => ({
          ...c,
          key: c.key || '',
          label: c.label || '',
        }));
        setCategoriesList(normalized);
      }
    } catch (err) {
      console.warn('Gagal memuat Master Kategori FAQ:', err);
    } finally {
      setCatLoading(false);
    }
  };

  const loadFaqData = async () => {
    setLoading(true);
    try {
      const res = await getAllMasterFaqsAction();
      if (res?.success && Array.isArray(res.data)) {
        const normalized = res.data.map((it: any) => ({
          ...it,
          key: it.slug || '',
          label: it.judul || '',
        }));
        setDataList(normalized);
      }
    } catch (err) {
      console.warn('Gagal memuat Master Buku Pintar SOP:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadFaqData();
  }, []);

  // Opsi dropdown kategori dinamis dari database
  const kategoriOptions = useMemo<{ value: string; label: string; icon: string }[]>(() => {
    if (!categoriesList || categoriesList.length === 0) {
      return [];
    }
    return categoriesList.map((c: any) => ({
      value: c.key,
      label: c.label,
      icon: c.icon || '📖',
    }));
  }, [categoriesList]);

  function getCategoryIcon(kategori: string): string {
    const match = kategoriOptions.find((k) => k.value === kategori);
    return match?.icon || '📖';
  }

  // ── FAQ CRUD HANDLERS ──
  const handleCreateFaq = async (formData: any) => {
    if (!formData.judul?.trim() || !formData.kategori?.trim()) {
      alert('Judul Layanan dan Kategori wajib diisi!');
      return false;
    }

    const autoSlug = (formData.slug?.trim() || generateSlug(formData.judul));
    const autoIcon = formData.icon || getCategoryIcon(formData.kategori);

    const payload = {
      slug: autoSlug,
      kategori: formData.kategori,
      kategori_label: formData.kategori_label || kategoriOptions.find((k) => k.value === formData.kategori)?.label || formData.kategori,
      icon: autoIcon,
      judul: formData.judul.trim(),
      subjudul: formData.subjudul ? formData.subjudul.trim() : '',
      tags: typeof formData.tags === 'string'
        ? formData.tags.split(',').map((s: string) => s.trim()).filter(Boolean)
        : Array.isArray(formData.tags) ? formData.tags : [],
      persyaratan: typeof formData.persyaratan === 'string'
        ? formData.persyaratan.split('\n').map((s: string) => s.trim()).filter(Boolean)
        : Array.isArray(formData.persyaratan) ? formData.persyaratan : [],
      prosedur: typeof formData.prosedur === 'string'
        ? formData.prosedur.split('\n').map((s: string) => s.trim()).filter(Boolean)
        : Array.isArray(formData.prosedur) ? formData.prosedur : [],
      biaya_pnbp: formData.biaya_pnbp || 'GRATIS',
      lokasi_pelayanan: formData.lokasi_pelayanan || 'Mako Polres Pekalongan',
      jam_operasional: formData.jam_operasional || '08.00 - 15.00 WIB',
      waktu_penyelesaian: formData.waktu_penyelesaian || '± 15 - 30 Menit',
      script_operator: formData.script_operator || '',
      kontak_penting: formData.kontak_penting || undefined,
      display_order: Number(formData.display_order) || 1,
      is_active: formData.is_active !== undefined ? formData.is_active : true,
    };

    return await createMasterFaqAction(payload);
  };

  const handleUpdateFaq = async (id: number | string, formData: any) => {
    const autoSlug = (formData.slug?.trim() || generateSlug(formData.judul));
    const autoIcon = formData.icon || getCategoryIcon(formData.kategori);

    const payload = {
      slug: autoSlug,
      kategori: formData.kategori,
      kategori_label: formData.kategori_label || kategoriOptions.find((k) => k.value === formData.kategori)?.label || formData.kategori,
      icon: autoIcon,
      judul: formData.judul.trim(),
      subjudul: formData.subjudul ? formData.subjudul.trim() : '',
      tags: typeof formData.tags === 'string'
        ? formData.tags.split(',').map((s: string) => s.trim()).filter(Boolean)
        : Array.isArray(formData.tags) ? formData.tags : [],
      persyaratan: typeof formData.persyaratan === 'string'
        ? formData.persyaratan.split('\n').map((s: string) => s.trim()).filter(Boolean)
        : Array.isArray(formData.persyaratan) ? formData.persyaratan : [],
      prosedur: typeof formData.prosedur === 'string'
        ? formData.prosedur.split('\n').map((s: string) => s.trim()).filter(Boolean)
        : Array.isArray(formData.prosedur) ? formData.prosedur : [],
      biaya_pnbp: formData.biaya_pnbp || 'GRATIS',
      lokasi_pelayanan: formData.lokasi_pelayanan || 'Mako Polres Pekalongan',
      jam_operasional: formData.jam_operasional || '08.00 - 15.00 WIB',
      waktu_penyelesaian: formData.waktu_penyelesaian || '± 15 - 30 Menit',
      script_operator: formData.script_operator || '',
      kontak_penting: formData.kontak_penting || undefined,
      display_order: Number(formData.display_order) || 1,
      is_active: formData.is_active !== undefined ? formData.is_active : true,
    };

    return await updateMasterFaqAction(Number(id), payload);
  };

  const handleDeleteFaq = async (id: number | string) => {
    return await deleteMasterFaqAction(Number(id));
  };

  const parseArrayString = (raw: any): string => {
    if (!raw) return '';
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed)) return parsed.join('\n');
      return String(raw);
    } catch {
      return String(raw);
    }
  };

  const parseTagsString = (raw: any): string => {
    if (!raw) return '';
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed)) return parsed.join(', ');
      return String(raw);
    } catch {
      return String(raw);
    }
  };

  const getEditFormDataFaq = (item: any) => ({
    id: item.id,
    slug: item.slug ?? '',
    kategori: item.kategori ?? (kategoriOptions[0]?.value || 'LANTAS_SIM'),
    kategori_label: item.kategori_label ?? (kategoriOptions[0]?.label || 'Lalu Lintas & SIM'),
    icon: item.icon ?? '📖',
    judul: item.judul ?? '',
    subjudul: item.subjudul ?? '',
    tags: parseTagsString(item.tags),
    persyaratan: parseArrayString(item.persyaratan),
    prosedur: parseArrayString(item.prosedur),
    biaya_pnbp: item.biaya_pnbp ?? '',
    lokasi_pelayanan: item.lokasi_pelayanan ?? '',
    jam_operasional: item.jam_operasional ?? '',
    waktu_penyelesaian: item.waktu_penyelesaian ?? '',
    script_operator: item.script_operator ?? '',
    kontak_penting: item.kontak_penting ?? '',
    display_order: item.display_order ?? 1,
    is_active: item.is_active !== undefined ? item.is_active : true,
  });

  // ── CATEGORY CRUD HANDLERS ──
  const handleCreateCategory = async (formData: any) => {
    if (!formData.key?.trim() || !formData.label?.trim()) {
      alert('Kode Kategori dan Label wajib diisi!');
      return false;
    }

    const res = await createMasterFaqCategoryAction({
      key: formData.key.trim().toUpperCase().replace(/[\s-]/g, '_'),
      label: formData.label.trim(),
      icon: formData.icon || '📖',
      description: formData.description || '',
      display_order: Number(formData.display_order) || 1,
      is_active: formData.is_active !== undefined ? formData.is_active : true,
    });

    if (res.success) {
      await loadCategories();
    }
    return res;
  };

  const handleUpdateCategory = async (id: number | string, formData: any) => {
    const res = await updateMasterFaqCategoryAction(Number(id), {
      key: formData.key?.trim().toUpperCase().replace(/[\s-]/g, '_'),
      label: formData.label?.trim(),
      icon: formData.icon || '📖',
      description: formData.description || '',
      display_order: Number(formData.display_order) || 1,
      is_active: formData.is_active !== undefined ? formData.is_active : true,
    });

    if (res.success) {
      await loadCategories();
    }
    return res;
  };

  const handleDeleteCategory = async (id: number | string) => {
    const res = await deleteMasterFaqCategoryAction(Number(id));
    if (res.success) {
      await loadCategories();
    }
    return res;
  };

  const getEditFormDataCategory = (item: any) => ({
    id: item.id,
    key: item.key ?? '',
    label: item.label ?? '',
    icon: item.icon ?? '📖',
    description: item.description ?? '',
    display_order: item.display_order ?? 1,
    is_active: item.is_active !== undefined ? item.is_active : true,
  });

  return (
    <div>
      {/* ── SUB-TAB SWITCHER (PANDUAN SOP & FAQ vs MASTER KATEGORI) ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '6px',
            background: '#F1F5F9',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
          }}
        >
          <button
            type="button"
            onClick={() => setSubTab('faq')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 16px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: subTab === 'faq' ? '#1E40AF' : 'transparent',
              color: subTab === 'faq' ? '#FFFFFF' : '#475569',
              boxShadow: subTab === 'faq' ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <span>📖</span>
            <span>Daftar Panduan SOP &amp; FAQ ({dataList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('category')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 16px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: subTab === 'category' ? '#1E40AF' : 'transparent',
              color: subTab === 'category' ? '#FFFFFF' : '#475569',
              boxShadow: subTab === 'category' ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <span>🏷️</span>
            <span>Master Kategori Layanan ({categoriesList.length})</span>
          </button>
        </div>

        <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></span>
          <span>Terhubung Live Database TiDB (Serverless Cloud)</span>
        </div>
      </div>

      {/* ── VIEW 1: MASTER FAQ / SOP ── */}
      {subTab === 'faq' && (
        <MasterTabShell
          config={{
            title: 'Master Buku Pintar SOP & Dynamic FAQ Layanan (Operator 110)',
            desc: 'Pangkalan data resmi SOP kepolisian, syarat berkas, tarif PNBP, lokasi, dan skrip telepon 110. Perubahan langsung aktif di konsol CAD operator & pesan WhatsApp warga.',
            addBtn: 'Tambah Panduan SOP',
            icon: '📖',
          }}
          modalWidth="760px"
          dataList={dataList}
          loading={loading}
          lookups={lookups}
          showToast={showToast}
          onRefreshDropdowns={onRefreshDropdowns}
          onReload={loadFaqData}
          onCreate={handleCreateFaq}
          onUpdate={handleUpdateFaq}
          onDelete={handleDeleteFaq}
          getEditFormData={getEditFormDataFaq}
          getDeleteLabel={(item) => item.judul || item.slug}
          extraSearchFields={(item) => [
            item.slug || '',
            item.judul || '',
            item.subjudul || '',
            item.kategori_label || '',
            item.lokasi_pelayanan || '',
            item.biaya_pnbp || '',
            item.tags || '',
          ]}
          tableColumns={[
            {
              header: 'JUDUL & KATEGORI',
              render: (item) => (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ fontSize: '18px', lineHeight: 1.2 }}>{item.icon || '📖'}</span>
                  <div>
                    <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '13px', lineHeight: 1.3 }}>
                      {item.judul}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '10px' }}>
                        {item.kategori_label}
                      </span>
                      <span>•</span>
                      <span style={{ fontStyle: 'italic', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                        {item.subjudul}
                      </span>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              header: 'TARIF RESMI (PNBP)',
              width: '170px',
              render: (item) => {
                const isGratis = (item.biaya_pnbp || '').toLowerCase().includes('gratis');
                return (
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: isGratis ? '#15803D' : '#0F172A',
                      background: isGratis ? '#DCFCE7' : '#F8FAFC',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: isGratis ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                      display: 'inline-block',
                    }}
                  >
                    {item.biaya_pnbp || 'GRATIS'}
                  </span>
                );
              },
            },
            {
              header: 'LOKASI LAYANAN',
              width: '180px',
              render: (item) => (
                <div style={{ fontSize: '11.5px', color: '#334155' }}>
                  <div style={{ fontWeight: 600 }}>{item.lokasi_pelayanan || 'Polres Pekalongan'}</div>
                  <div style={{ fontSize: '10.5px', color: '#64748B' }}>{item.jam_operasional || 'Jam Kerja'}</div>
                </div>
              ),
            },
            {
              header: 'STATUS',
              width: '90px',
              render: (item) => (
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
                  {item.is_active ? '✓ Aktif' : '✕ Nonaktif'}
                </span>
              ),
            },
          ]}
          renderFormFields={(formData, setFormData) => {
            const handleKategoriChange = (val: string) => {
              const matched = kategoriOptions.find((k) => k.value === val);
              setFormData((prev: any) => ({
                ...prev,
                kategori: val,
                kategori_label: matched ? matched.label : val,
              }));
            };

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Baris 1: Kategori Dropdown & Label Kategori (Dinamis dari Master Kategori) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                      Kategori SOP / Layanan <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <Select2CustomDropdown
                      value={formData.kategori || (kategoriOptions[0]?.value || 'LANTAS_SIM')}
                      onChange={handleKategoriChange}
                      options={kategoriOptions}
                      placeholder="Pilih Kategori Layanan"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                      Label Kategori Tampilan
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', background: 'white' }}
                      value={formData.kategori_label ?? ''}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, kategori_label: e.target.value }))}
                      placeholder="Contoh: Lalu Lintas & SIM"
                    />
                  </div>
                </div>

                {/* Baris 2: Judul & Subjudul */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                    Judul Layanan Kepolisian <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 700, background: 'white' }}
                    value={formData.judul ?? ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, judul: e.target.value }))}
                    placeholder="Contoh: Perpanjangan SIM A & SIM C (Satpas & Layanan Keliling)"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                    Subjudul / Ringkasan Keterangan
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', background: 'white' }}
                    value={formData.subjudul ?? ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, subjudul: e.target.value }))}
                    placeholder="Panduan syarat dan alur perpanjangan masa berlaku SIM sebelum jatuh tempo"
                  />
                </div>

                {/* Baris 3: Tarif PNBP & Durasi */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                      Tarif Resmi PNBP (PP No. 76 Tahun 2020)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', background: 'white' }}
                      value={formData.biaya_pnbp ?? ''}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, biaya_pnbp: e.target.value }))}
                      placeholder="Contoh: SIM A: Rp 80.000 | SIM C: Rp 75.000 / GRATIS"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                      Estimasi Waktu Proses
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', background: 'white' }}
                      value={formData.waktu_penyelesaian ?? ''}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, waktu_penyelesaian: e.target.value }))}
                      placeholder="Contoh: ± 20 – 40 Menit"
                    />
                  </div>
                </div>

                {/* Baris 4: Lokasi Pelayanan & Jam Operasional */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                      Lokasi Pelayanan
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', background: 'white' }}
                      value={formData.lokasi_pelayanan ?? ''}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, lokasi_pelayanan: e.target.value }))}
                      placeholder="Contoh: Gedung Satpas Satlantas Polres Pekalongan"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                      Jam Operasional
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', background: 'white' }}
                      value={formData.jam_operasional ?? ''}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, jam_operasional: e.target.value }))}
                      placeholder="Contoh: Senin – Jumat: 08.00 – 14.00 WIB"
                    />
                  </div>
                </div>

                {/* Baris 5: Kontak Penting, Urutan, Status Aktif */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                      Kontak Penting / Hotline WhatsApp
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', background: 'white' }}
                      value={formData.kontak_penting ?? ''}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, kontak_penting: e.target.value }))}
                      placeholder="0812-xxxx-xxxx"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                      Nomor Urut
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', background: 'white' }}
                      value={formData.display_order ?? 1}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, display_order: Number(e.target.value) || 1 }))}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Status Layanan
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.is_active ?? true}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, is_active: e.target.checked }))}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span>{formData.is_active ? 'Aktif' : 'Nonaktif'}</span>
                    </label>
                  </div>
                </div>

                {/* Baris 6: Skrip Jawaban Suara Operator 110 */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#0369A1', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🎧 Skrip Suara Siap Baca Operator 110 (Telepon Warga)</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #BAE6FD', fontSize: '12.5px', background: '#F0F9FF', color: '#0C4A6E', lineHeight: 1.5 }}
                    value={formData.script_operator ?? ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, script_operator: e.target.value }))}
                    placeholder="Tuliskan kalimat sopan dan informatif yang langsung dibaca oleh operator 110 ke penelepon..."
                  />
                </div>

                {/* Baris 7: Persyaratan Berkas */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                    Daftar Persyaratan Berkas (1 Baris per Butir Persyaratan)
                  </label>
                  <textarea
                    className="form-control"
                    rows={4}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', background: 'white', lineHeight: 1.5 }}
                    value={formData.persyaratan ?? ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, persyaratan: e.target.value }))}
                    placeholder="Contoh:&#10;e-KTP Asli dan fotokopi 2 lembar&#10;SIM lama yang masih berlaku&#10;Surat hasil pemeriksaan kesehatan..."
                  />
                </div>

                {/* Baris 8: Alur Prosedur */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                    Alur Tahapan Prosedur (1 Baris per Tahap)
                  </label>
                  <textarea
                    className="form-control"
                    rows={4}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', background: 'white', lineHeight: 1.5 }}
                    value={formData.prosedur ?? ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, prosedur: e.target.value }))}
                    placeholder="Contoh:&#10;Pendaftaran di loket pelayanan&#10;Pemeriksaan identitas dan berkas fisik&#10;Pembayaran biaya PNBP di loket resmi&#10;Pengambilan foto dan sidik jari..."
                  />
                </div>

                {/* Baris 9: Tags Pencarian */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                    Kata Kunci Pencarian (Pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', background: 'white' }}
                    value={formData.tags ?? ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, tags: e.target.value }))}
                    placeholder="sim, perpanjang, satpas, biaya sim, sim keliling"
                  />
                </div>
              </div>
            );
          }}
        />
      )}

      {/* ── VIEW 2: MASTER KATEGORI LAYANAN ── */}
      {subTab === 'category' && (
        <MasterTabShell
          config={{
            title: 'Master Kategori Buku Pintar SOP & Layanan',
            desc: 'Daftar kategori resmi untuk mengelompokkan panduan kepolisian. Kategori yang dibuat di sini otomatis menjadi tab filter di Konsol Operator CAD 110 & Buku Pintar Pawas.',
            addBtn: 'Tambah Kategori Layanan',
            icon: '🏷️',
          }}
          modalWidth="540px"
          dataList={categoriesList}
          loading={catLoading}
          lookups={lookups}
          showToast={showToast}
          onRefreshDropdowns={onRefreshDropdowns}
          onReload={loadCategories}
          onCreate={handleCreateCategory}
          onUpdate={handleUpdateCategory}
          onDelete={handleDeleteCategory}
          getEditFormData={getEditFormDataCategory}
          getDeleteLabel={(item) => `${item.icon || '🏷️'} ${item.label} (${item.key})`}
          extraSearchFields={(item) => [item.key || '', item.label || '', item.description || '']}
          tableColumns={[
            {
              header: 'LABEL KATEGORI',
              render: (item) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{item.icon || '🏷️'}</span>
                  <div>
                    <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '13px' }}>
                      {item.label}
                    </div>
                    {item.description && (
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                        {item.description}
                      </div>
                    )}
                  </div>
                </div>
              ),
            },
            {
              header: 'URUTAN',
              width: '90px',
              render: (item) => (
                <span style={{ fontWeight: 700, color: '#475569', fontSize: '12px' }}>
                  #{item.display_order ?? 1}
                </span>
              ),
            },
            {
              header: 'STATUS',
              width: '100px',
              render: (item) => (
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
                  {item.is_active ? '✓ Aktif' : '✕ Nonaktif'}
                </span>
              ),
            },
          ]}
          renderFormFields={(formData, setFormData) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                    Kode Kategori (Key Unik) <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', fontWeight: 700, textTransform: 'uppercase', background: 'white' }}
                    value={formData.key ?? ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, key: e.target.value.toUpperCase().replace(/[\s-]/g, '_') }))}
                    placeholder="Contoh: LANTAS_SIM"
                    required
                  />
                  <div style={{ fontSize: '10.5px', color: '#94A3B8', marginTop: '3px' }}>Gunakan huruf kapital dan garis bawah (A-Z, _).</div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                    Icon Emoji
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '16px', textAlign: 'center', background: 'white' }}
                    value={formData.icon ?? '📖'}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, icon: e.target.value }))}
                    placeholder="🚗"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                  Label Kategori <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 700, background: 'white' }}
                  value={formData.label ?? ''}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, label: e.target.value }))}
                  placeholder="Contoh: Lalu Lintas & SIM"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                  Deskripsi Kategori (Opsional)
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', background: 'white' }}
                  value={formData.description ?? ''}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, description: e.target.value }))}
                  placeholder="Deskripsi singkat seputar layanan ini..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                    Nomor Urut Tampilan
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', background: 'white' }}
                    value={formData.display_order ?? 1}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, display_order: Number(e.target.value) || 1 }))}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Status Kategori
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_active ?? true}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, is_active: e.target.checked }))}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span>{formData.is_active ? 'Aktif' : 'Nonaktif'}</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
}
