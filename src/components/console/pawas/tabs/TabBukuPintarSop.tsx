'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  BookOpen,
  Send,
  Copy,
  CheckCircle2,
  Clock,
  MapPin,
  DollarSign,
  FileText,
  PhoneCall,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { KnowledgeFaqItem } from '@/lib/knowledge-base-data';
import { getKnowledgeBaseItemsAction, sendKnowledgeFaqWhatsAppAction } from '@/app/actions/knowledge.actions';
import { PawasTab } from '../types';

interface TabBukuPintarSopProps {
  switchTab: (tab: PawasTab) => void;
  userProfile?: any;
  showFriendlyToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => void;
  initialCallerPhone?: string;
  initialCallerName?: string;
}

export default function TabBukuPintarSop({
  switchTab,
  userProfile,
  showFriendlyToast,
  initialCallerPhone = '',
  initialCallerName = '',
}: TabBukuPintarSopProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    'sim-perpanjang': true, // default expand the most frequent one
  });

  // Modal WhatsApp state
  const [activeFaqForWa, setActiveFaqForWa] = useState<KnowledgeFaqItem | null>(null);
  const [waRecipientPhone, setWaRecipientPhone] = useState(initialCallerPhone);
  const [waRecipientName, setWaRecipientName] = useState(initialCallerName);
  const [isSendingWa, setIsSendingWa] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (initialCallerPhone) setWaRecipientPhone(initialCallerPhone);
    if (initialCallerName) setWaRecipientName(initialCallerName);
  }, [initialCallerPhone, initialCallerName]);

  const [dbItems, setDbItems] = useState<KnowledgeFaqItem[]>([]);
  const [dbCategories, setDbCategories] = useState<{ key: string; label: string; icon: string; count?: number }[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(true);

  const fetchKnowledge = React.useCallback(async () => {
    setIsLoadingDb(true);
    try {
      const res = await getKnowledgeBaseItemsAction();
      if (res.success && Array.isArray(res.data)) {
        setDbItems(res.data);
        if (Array.isArray(res.categories)) {
          setDbCategories(res.categories);
        }
      }
    } catch (e) {
      console.error('Gagal memuat knowledge base dari database:', e);
    } finally {
      setIsLoadingDb(false);
    }
  }, []);

  useEffect(() => {
    fetchKnowledge();
  }, [fetchKnowledge]);

  // Categories list (Dinamis dari Master Database master_knowledge_faq_categories)
  const categoryTabs = useMemo(() => {
    const allTab = { key: 'ALL', label: 'Semua Layanan', icon: '📚' };
    if (!dbCategories || dbCategories.length === 0) {
      return [allTab];
    }
    return [allTab, ...dbCategories];
  }, [dbCategories]);

  // Filtered Items (dari database)
  const filteredItems = useMemo(() => {
    let result = Array.isArray(dbItems) ? [...dbItems] : [];

    if (selectedCategory && selectedCategory !== 'ALL') {
      result = result.filter((item) => item?.kategori === selectedCategory);
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((item) => {
        if (!item) return false;
        const inJudul = (item.judul || '').toLowerCase().includes(q);
        const inSubjudul = (item.subjudul || '').toLowerCase().includes(q);
        const inTags = Array.isArray(item.tags) && item.tags.some((t) => (t || '').toLowerCase().includes(q));
        const inSyarat = Array.isArray(item.persyaratan) && item.persyaratan.some((p) => (p || '').toLowerCase().includes(q));
        const inProsedur = Array.isArray(item.prosedur) && item.prosedur.some((pr) => (pr || '').toLowerCase().includes(q));
        const inLokasi = (item.lokasiPelayanan || '').toLowerCase().includes(q);
        const inScript = (item.scriptOperator || '').toLowerCase().includes(q);
        return inJudul || inSubjudul || inTags || inSyarat || inProsedur || inLokasi || inScript;
      });
    }

    return result;
  }, [selectedCategory, searchQuery, dbItems]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyScript = (item: KnowledgeFaqItem) => {
    navigator.clipboard.writeText(item.scriptOperator);
    setCopiedId(item.id);
    showFriendlyToast('success', 'Skrip Berhasil Disalin', `Kalimat jawaban untuk "${item.judul}" telah disalin ke clipboard.`);
    setTimeout(() => {
      setCopiedId(null);
    }, 2500);
  };

  const handleCopyAllSummary = (item: KnowledgeFaqItem) => {
    const summary = [
      `*PANDUAN LAYANAN: ${item.judul.toUpperCase()}*`,
      `Lokasi: ${item.lokasiPelayanan}`,
      `Jam: ${item.jamOperasional}`,
      `Tarif Resmi: ${item.biayaPnbp}`,
      ``,
      `*Persyaratan:*`,
      ...item.persyaratan.map((p, i) => `${i + 1}. ${p}`),
      ``,
      `*Prosedur Singkat:*`,
      ...item.prosedur.map((pr, i) => `${i + 1}. ${pr}`),
    ].join('\n');

    navigator.clipboard.writeText(summary);
    showFriendlyToast('info', 'Rangkuman Disalin', 'Rangkuman lengkap persyaratan & alur berhasil disalin.');
  };

  const handleSendWa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFaqForWa) return;

    if (!waRecipientPhone || waRecipientPhone.trim().length < 9) {
      showFriendlyToast('warning', 'Nomor Tidak Valid', 'Masukkan minimal 9-14 digit nomor WhatsApp warga tujuan.');
      return;
    }

    setIsSendingWa(true);
    try {
      const res = await sendKnowledgeFaqWhatsAppAction({
        phone: waRecipientPhone,
        faqId: activeFaqForWa.id,
        recipientName: waRecipientName,
        petugasName: userProfile?.fullName || userProfile?.nama || 'Operator 110',
      });

      if (res.success) {
        showFriendlyToast('success', 'WhatsApp Terkirim', res.message);
        setActiveFaqForWa(null);
      } else {
        showFriendlyToast('error', 'Gagal Mengirim', res.message || 'Koneksi ke gateway pesan bermasalah.');
      }
    } catch (err: any) {
      showFriendlyToast('error', 'Kesalahan Sistem', err.message || 'Gagal memproses pengiriman WhatsApp.');
    } finally {
      setIsSendingWa(false);
    }
  };

  const getManualWaUrl = (item: KnowledgeFaqItem, phone: string, name: string) => {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    const msg = [
      `*PANDUAN RESMI LAYANAN KEPOLISIAN*`,
      `*POLRES PEKALONGAN - LAYANAN 110*`,
      `------------------------------------------`,
      `Halo Bapak/Ibu${name ? ' ' + name.trim() : ''},`,
      `Berikut adalah rincian persyaratan resmi untuk:`,
      `📌 *${item.judul}*`,
      ``,
      `📋 *Persyaratan:*`,
      ...item.persyaratan.map((p, i) => `${i + 1}. ${p}`),
      ``,
      `💰 *Tarif Resmi:* ${item.biayaPnbp}`,
      `🏢 *Lokasi:* ${item.lokasiPelayanan}`,
      `⏰ *Jam Operasional:* ${item.jamOperasional}`,
      ``,
      `_Informasi resmi disiapkan oleh Operator 110 Polres Pekalongan._`,
    ].join('\n');

    return `https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div style={{ width: '100%', maxWidth: '1440px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* ── TOP NAV BREADCRUMB ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div
          onClick={() => switchTab('view-beranda')}
          style={{ fontSize: '13px', fontWeight: 700, color: '#153E75', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span>←</span> Kembali ke Beranda Konsol
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => fetchKnowledge()}
            disabled={isLoadingDb}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              background: '#F8FAFC',
              border: '1px solid #CBD5E1',
              color: '#334155',
              fontSize: '12px',
              fontWeight: 700,
              cursor: isLoadingDb ? 'wait' : 'pointer',
            }}
            title="Sinkronisasi data SOP terbaru dari tabel master_knowledge_faqs"
          >
            <span>{isLoadingDb ? '🔄 Memuat...' : '🔄 Sinkron Database'}</span>
          </button>

          <button
            type="button"
            onClick={() => switchTab('view-operator')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              color: '#1E40AF',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <span>🎧</span> Buka Konsol CAD 110
          </button>
        </div>
      </div>

      {/* ── HERO BANNER ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #0369A1 100%)',
          borderRadius: '16px',
          padding: '24px 28px',
          color: 'white',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
          marginBottom: '20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: '-20px',
            top: '-20px',
            fontSize: '160px',
            opacity: 0.08,
            pointerEvents: 'none',
          }}
        >
          📖
        </div>

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '820px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '4px 12px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 700, marginBottom: '10px' }}>
            <Sparkles size={14} color="#38BDF8" />
            <span>Digital Knowledge Base &amp; Dynamic FAQ • Terhubung Master DB TiDB</span>
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.3px', lineHeight: 1.25 }}>
            Buku Pintar SOP &amp; Panduan Layanan Kepolisian
          </h1>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#E2E8F0', lineHeight: 1.5 }}>
            Solusi cepat operator 110 untuk menjawab penelepon yang menanyakan informasi administrasi kepolisian (SIM, STNK, BPKB, SKCK, Cyber Crime, Laporan Kehilangan, &amp; SOP penanganan aduan). Lengkap dengan skrip respons ramah suara dan fitur kirim checklist ke WhatsApp warga secara instan.
          </p>

          {/* Quick Search in Hero */}
          <div style={{ marginTop: '18px', position: 'relative', maxWidth: '640px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search
                size={18}
                color="#64748B"
                style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari syarat perpanjang SIM, alur STNK hilang, tarif SKCK, blokir rekening cyber..."
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 42px',
                  borderRadius: '10px',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  background: 'white',
                  color: '#0F172A',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  outline: 'none',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: '#F1F5F9',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748B',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {searchQuery && (
              <div style={{ fontSize: '11.5px', color: '#BAE6FD', marginTop: '6px' }}>
                Menampilkan hasil pencarian untuk: <strong>&quot;{searchQuery}&quot;</strong> ({filteredItems.length} panduan ditemukan)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CATEGORY PILLS BAR ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '20px',
          scrollbarWidth: 'none',
        }}
      >
        {categoryTabs.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          const count = cat.key === 'ALL'
            ? dbItems.length
            : dbItems.filter((i) => i.kategori === cat.key).length;

          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '30px',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                background: isSelected ? '#153E75' : 'white',
                color: isSelected ? 'white' : '#475569',
                border: isSelected ? '1px solid #153E75' : '1px solid #E2E8F0',
                boxShadow: isSelected ? '0 3px 8px rgba(21, 62, 117, 0.25)' : 'none',
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 7px',
                  borderRadius: '12px',
                  background: isSelected ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                  color: isSelected ? 'white' : '#64748B',
                  fontWeight: 800,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── CONTENT GRID / CARDS ── */}
      {isLoadingDb ? (
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            padding: '48px 24px',
            textAlign: 'center',
            color: '#64748B',
          }}
        >
          <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #E2E8F0', borderTopColor: '#1E40AF', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <div style={{ marginTop: '14px', fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>
            Memuat Panduan SOP dari Database TiDB...
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            padding: '48px 24px',
            textAlign: 'center',
            color: '#64748B',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
            Tidak Ada Panduan yang Sesuai
          </div>
          <p style={{ margin: '0 auto 16px auto', maxWidth: '400px', fontSize: '13px' }}>
            Tidak ditemukan kata kunci yang cocok dengan &quot;{searchQuery}&quot;. Coba gunakan kata kunci umum seperti <strong>SIM, STNK, SKCK, Rekening, atau Kehilangan</strong>.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
            }}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              background: '#153E75',
              color: 'white',
              fontSize: '12.5px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Reset Pencarian
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredItems.map((item) => {
            const isExpanded = !!expandedIds[item.id];

            return (
              <div
                key={item.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  border: isExpanded ? '1.5px solid #93C5FD' : '1px solid #E2E8F0',
                  boxShadow: isExpanded ? '0 6px 18px rgba(37, 99, 235, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden',
                }}
              >
                {/* Header Card (Clickable to Expand) */}
                <div
                  onClick={() => toggleExpand(item.id)}
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    gap: '14px',
                    background: isExpanded ? '#F8FAFC' : 'white',
                    borderBottom: isExpanded ? '1px solid #E2E8F0' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        background: '#EFF6FF',
                        border: '1px solid #DBEAFE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: '#F1F5F9',
                            color: '#475569',
                            border: '1px solid #E2E8F0',
                            textTransform: 'uppercase',
                            letterSpacing: '0.3px',
                          }}
                        >
                          {item.kategoriLabel}
                        </span>

                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: item.biayaPnbp.toLowerCase().includes('gratis') ? '#ECFDF5' : '#FEF3C7',
                            color: item.biayaPnbp.toLowerCase().includes('gratis') ? '#065F46' : '#92400E',
                            border: item.biayaPnbp.toLowerCase().includes('gratis') ? '1px solid #A7F3D0' : '1px solid #FDE68A',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <DollarSign size={12} />
                          <span>{item.biayaPnbp.toLowerCase().includes('gratis') ? 'GRATIS (Tanpa Biaya)' : 'PNBP Resmi'}</span>
                        </span>
                      </div>

                      <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                        {item.judul}
                      </h3>
                      <p style={{ margin: 0, fontSize: '12.5px', color: '#64748B', lineHeight: 1.4 }}>
                        {item.subjudul}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFaqForWa(item);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: '#22C55E',
                        color: 'white',
                        border: 'none',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 5px rgba(34, 197, 94, 0.25)',
                      }}
                      title="Kirim detail ke WhatsApp warga"
                    >
                      <Send size={13} />
                      <span>Kirim WA</span>
                    </button>

                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: '#F1F5F9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748B',
                      }}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div style={{ padding: '20px', background: 'white' }}>
                    {/* ── SCRIPT JAWABAN OPERATOR (HIGHLIGHTED BOX) ── */}
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
                        border: '1.5px solid #BAE6FD',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        marginBottom: '18px',
                        position: 'relative',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#0369A1' }}>
                          <PhoneCall size={14} />
                          <span>SKRIP RESPON OPERATOR 110 (Baca Langsung ke Telepon):</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyScript(item)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: 'white',
                            border: '1px solid #7DD3FC',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: copiedId === item.id ? '#166534' : '#0284C7',
                            cursor: 'pointer',
                          }}
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check size={12} color="#166534" />
                              <span>Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Salin Skrip</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div
                        style={{
                          fontSize: '13px',
                          color: '#0C4A6E',
                          lineHeight: 1.6,
                          fontWeight: 500,
                          fontStyle: 'italic',
                          background: 'rgba(255, 255, 255, 0.6)',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          borderLeft: '3px solid #0284C7',
                        }}
                      >
                        &ldquo;{item.scriptOperator}&rdquo;
                      </div>
                    </div>

                    {/* ── DUA KOLOM: PERSYARATAN & ALUR PROSEDUR ── */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '16px',
                        marginBottom: '16px',
                      }}
                    >
                      {/* Kolom Persyaratan */}
                      <div
                        style={{
                          background: '#F8FAFC',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          padding: '14px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 800, color: '#1E293B', marginBottom: '10px' }}>
                          <CheckCircle2 size={15} color="#2563EB" />
                          <span>Daftar Persyaratan Berkas:</span>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#334155', lineHeight: 1.6 }}>
                          {item.persyaratan.map((syarat, idx) => (
                            <li key={idx} style={{ marginBottom: '4px' }}>
                              {syarat}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Kolom Prosedur */}
                      <div
                        style={{
                          background: '#F8FAFC',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          padding: '14px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 800, color: '#1E293B', marginBottom: '10px' }}>
                          <FileText size={15} color="#0D9488" />
                          <span>Alur Tahapan Prosedur:</span>
                        </div>
                        <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#334155', lineHeight: 1.6 }}>
                          {item.prosedur.map((proc, idx) => (
                            <li key={idx} style={{ marginBottom: '4px' }}>
                              {proc}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>

                    {/* ── META INFO: TARIF, LOKASI, JAM & ESTIMASI ── */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '10px',
                        background: '#F1F5F9',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        fontSize: '11.5px',
                        color: '#475569',
                        marginBottom: '14px',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <DollarSign size={13} color="#059669" /> Tarif Resmi (PNBP):
                        </span>
                        <div style={{ color: '#0F172A', fontWeight: 600, marginTop: '2px' }}>{item.biayaPnbp}</div>
                      </div>

                      <div>
                        <span style={{ fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={13} color="#DC2626" /> Lokasi Pelayanan:
                        </span>
                        <div style={{ color: '#0F172A', fontWeight: 600, marginTop: '2px' }}>{item.lokasiPelayanan}</div>
                      </div>

                      <div>
                        <span style={{ fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} color="#2563EB" /> Jam Operasional &amp; Durasi:
                        </span>
                        <div style={{ color: '#0F172A', fontWeight: 600, marginTop: '2px' }}>
                          {item.jamOperasional} • {item.waktuPenyelesaian}
                        </div>
                      </div>
                    </div>

                    {/* ── ACTION FOOTER ── */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '8px', borderTop: '1px dashed #E2E8F0' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {item.tags.slice(0, 5).map((t, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '10.5px',
                              background: '#F8FAFC',
                              color: '#64748B',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              border: '1px solid #E2E8F0',
                            }}
                          >
                            #{t}
                          </span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleCopyAllSummary(item)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            background: '#F8FAFC',
                            border: '1px solid #CBD5E1',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            color: '#334155',
                            cursor: 'pointer',
                          }}
                        >
                          <Copy size={13} />
                          <span>Salin Rangkuman</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveFaqForWa(item)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            background: '#15803D',
                            border: 'none',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            color: 'white',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(21, 128, 61, 0.25)',
                          }}
                        >
                          <Send size={13} />
                          <span>Kirim Panduan ke WhatsApp Warga</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL KIRIM WHATSAPP KE WARGA ── */}
      {activeFaqForWa && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              position: 'relative',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: '#DCFCE7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                  }}
                >
                  💬
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                    Kirim Checklist ke WhatsApp
                  </h3>
                  <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                    Panduan: <strong>{activeFaqForWa.judul}</strong>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveFaqForWa(null)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748B',
                }}
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSendWa}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Nomor WhatsApp Warga Tujuan <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={waRecipientPhone}
                  onChange={(e) => setWaRecipientPhone(e.target.value.replace(/[^\d+-\s]/g, ''))}
                  placeholder="Contoh: 08123456789 atau 628123456789"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                />
                <span style={{ fontSize: '10.5px', color: '#64748B', marginTop: '3px', display: 'block' }}>
                  Format: Awali dengan 08 atau 62 (minimal 9 digit).
                </span>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Nama Warga Penelepon (Opsional)
                </label>
                <input
                  type="text"
                  value={waRecipientName}
                  onChange={(e) => setWaRecipientName(e.target.value)}
                  placeholder="Contoh: Bpk. Ahmad Subarjo"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                  }}
                />
              </div>

              {/* Preview Ringkasan Pesan */}
              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  padding: '12px',
                  marginBottom: '18px',
                  maxHeight: '140px',
                  overflowY: 'auto',
                  fontSize: '11px',
                  color: '#475569',
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>📋 Pratinjau Isi Pesan Otomatis:</div>
                <div>• Judul: {activeFaqForWa.judul}</div>
                <div>• Persyaratan: {activeFaqForWa.persyaratan.length} butir berkas</div>
                <div>• Tarif Resmi: {activeFaqForWa.biayaPnbp}</div>
                <div>• Lokasi: {activeFaqForWa.lokasiPelayanan}</div>
                <div>• Petugas Pengirim: {userProfile?.fullName || userProfile?.nama || 'Operator 110'}</div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="submit"
                  disabled={isSendingWa}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    background: isSendingWa ? '#94A3B8' : '#16A34A',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: isSendingWa ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 10px rgba(22, 163, 74, 0.25)',
                  }}
                >
                  <Send size={15} />
                  <span>{isSendingWa ? 'Mengirim via Gateway WhatsApp...' : 'Kirim Otomatis Sekarang (Gateway FlowKirim)'}</span>
                </button>

                {/* Alternatif Manual WhatsApp Web */}
                <a
                  href={getManualWaUrl(activeFaqForWa, waRecipientPhone, waRecipientName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    background: '#F1F5F9',
                    color: '#334155',
                    fontSize: '12px',
                    fontWeight: 700,
                    border: '1px solid #CBD5E1',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <ExternalLink size={14} />
                  <span>Cadangan: Buka Manual di WhatsApp Web / App</span>
                </a>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
