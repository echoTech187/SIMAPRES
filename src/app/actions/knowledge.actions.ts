'use server';

import { prisma } from '@/infrastructure/db/prisma.client';
import { WhatsAppService } from '@/infrastructure/services/whatsapp.service';
import { KnowledgeFaqItem } from '@/lib/knowledge-base-data';

export interface GetKnowledgeItemsResult {
  success: boolean;
  data: KnowledgeFaqItem[];
  total: number;
  categories: { key: string; label: string; icon: string; count: number }[];
}

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function mapDbRowToKnowledgeItem(row: any): KnowledgeFaqItem {
  return {
    id: row.slug || String(row.id),
    kategori: row.kategori,
    kategoriLabel: row.kategori_label,
    icon: row.icon || '📖',
    judul: row.judul,
    subjudul: row.subjudul,
    tags: safeJsonParse<string[]>(row.tags, []),
    persyaratan: safeJsonParse<string[]>(row.persyaratan, []),
    prosedur: safeJsonParse<string[]>(row.prosedur, []),
    biayaPnbp: row.biaya_pnbp,
    lokasiPelayanan: row.lokasi_pelayanan,
    jamOperasional: row.jam_operasional,
    waktuPenyelesaian: row.waktu_penyelesaian,
    scriptOperator: row.script_operator,
    kontakPenting: row.kontak_penting || undefined,
  };
}

/**
 * Mengambil daftar master panduan SOP & Dynamic FAQ secara dinamis dari database (Tabel master_knowledge_faqs)
 */
export async function getKnowledgeBaseItemsAction(
  searchQuery?: string,
  categoryFilter?: string
): Promise<GetKnowledgeItemsResult> {
  try {
    let dbRows = await prisma.masterKnowledgeFaq.findMany({
      where: {
        is_active: true,
        ...(categoryFilter && categoryFilter !== 'ALL'
          ? { kategori: categoryFilter }
          : {}),
      },
      orderBy: {
        display_order: 'asc',
      },
    });

    // Jika tabel di database masih kosong (belum terseed), jalankan seeder otomatis
    if (!dbRows || dbRows.length === 0) {
      try {
        const { seedKnowledgeFaqs } = await import('../../../prisma/seed_knowledge_faqs');
        await seedKnowledgeFaqs();
        dbRows = await prisma.masterKnowledgeFaq.findMany({
          where: {
            is_active: true,
            ...(categoryFilter && categoryFilter !== 'ALL'
              ? { kategori: categoryFilter }
              : {}),
          },
          orderBy: {
            display_order: 'asc',
          },
        });
      } catch (seedErr) {
        console.warn('[getKnowledgeBaseItemsAction] Auto-seed warning:', seedErr);
      }
    }

    let items: KnowledgeFaqItem[] = (dbRows || []).map(mapDbRowToKnowledgeItem);

    // 2. Filter Pencarian Teks jika ada query
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter((it) => {
        const inJudul = it.judul.toLowerCase().includes(q);
        const inSubjudul = it.subjudul.toLowerCase().includes(q);
        const inTags = it.tags.some((t) => t.toLowerCase().includes(q));
        const inSyarat = it.persyaratan.some((p) => p.toLowerCase().includes(q));
        const inProsedur = it.prosedur.some((pr) => pr.toLowerCase().includes(q));
        const inLokasi = it.lokasiPelayanan.toLowerCase().includes(q);
        const inScript = it.scriptOperator.toLowerCase().includes(q);
        return inJudul || inSubjudul || inTags || inSyarat || inProsedur || inLokasi || inScript;
      });
    }

    // 3. Ambil kategori resmi langsung dari tabel database master_knowledge_faq_categories
    const masterCats = await prisma.masterKnowledgeFaqCategory.findMany({
      where: { is_active: true },
      orderBy: { display_order: 'asc' },
    }).catch(() => []);

    const allActiveRows = await prisma.masterKnowledgeFaq.findMany({
      where: { is_active: true },
      select: { kategori: true },
    }).catch(() => []);

    const countMap = new Map<string, number>();
    allActiveRows.forEach((it: any) => {
      countMap.set(it.kategori, (countMap.get(it.kategori) || 0) + 1);
    });

    const categories = masterCats.map((mc: any) => ({
      key: mc.key,
      label: mc.label,
      icon: mc.icon || '📖',
      count: countMap.get(mc.key) || 0,
    }));

    return {
      success: true,
      data: items,
      total: items.length,
      categories,
    };
  } catch (error: any) {
    console.error('[getKnowledgeBaseItemsAction] Database query error:', error);
    return {
      success: false,
      data: [],
      total: 0,
      categories: [],
    };
  }
}

export interface SendKnowledgeFaqInput {
  phone: string;
  faqId: string;
  recipientName?: string;
  petugasName?: string;
}

export async function sendKnowledgeFaqWhatsAppAction(
  input: SendKnowledgeFaqInput
): Promise<{ success: boolean; message: string; error?: string; waWebUrl?: string }> {
  try {
    const { phone, faqId, recipientName, petugasName } = input;

    if (!phone || phone.trim().length < 9) {
      return {
        success: false,
        message: 'Nomor telepon tujuan tidak valid (minimal 9 digit).',
        error: 'INVALID_PHONE',
      };
    }

    // 1. Ambil data item dari database
    let item: KnowledgeFaqItem | null = null;
    const dbRow = await prisma.masterKnowledgeFaq.findFirst({
      where: {
        OR: [
          { slug: faqId },
          { id: !isNaN(Number(faqId)) ? Number(faqId) : undefined },
        ],
      },
    }).catch(() => null);

    if (dbRow) {
      item = mapDbRowToKnowledgeItem(dbRow);
    }

    if (!item) {
      return {
        success: false,
        message: 'Data panduan SOP tidak ditemukan di database.',
        error: 'FAQ_NOT_FOUND',
      };
    }

    const polresName = process.env.NEXT_PUBLIC_POLRES_NAME || 'Polres Pekalongan';
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

    // Susun template pesan resmi WhatsApp
    const lines: string[] = [
      `*PANDUAN RESMI LAYANAN KEPOLISIAN*`,
      `*LAYANAN 110 PRESISI - ${polresName.toUpperCase()}*`,
      `------------------------------------------`,
      `Halo Bapak/Ibu${recipientName ? ' ' + recipientName.trim() : ''},`,
      `Berikut adalah rincian informasi dan persyaratan resmi untuk layanan:`,
      `📌 *${item.judul}*`,
      ``,
      `📋 *PERSYARATAN BERKAS:*`,
      ...item.persyaratan.map((p, i) => ` ${i + 1}. ${p}`),
      ``,
      `🔄 *ALUR PROSEDUR:*`,
      ...item.prosedur.map((pr, i) => ` ${i + 1}. ${pr}`),
      ``,
      `💰 *TARIF RESMI (PNBP):*`,
      ` ${item.biayaPnbp}`,
      ``,
      `🏢 *LOKASI PELAYANAN:*`,
      ` ${item.lokasiPelayanan}`,
      ``,
      `⏰ *JAM OPERASIONAL & WAKTU:*`,
      ` ${item.jamOperasional}`,
      ` Estimasi proses: ${item.waktuPenyelesaian}`,
    ];

    if (item.kontakPenting) {
      lines.push(``, `📞 *KONTAK PENTING:*`, ` ${item.kontakPenting}`);
    }

    lines.push(
      ``,
      `------------------------------------------`,
      `_Pesan informasi resmi ini dikirimkan oleh Operator 110 ${polresName}${petugasName ? ` (${petugasName})` : ''} untuk memudahkan kepengurusan dokumen Anda. Seluruh pelayanan kepolisian bebas pungutan liar (Zero Pungli)._`,
      `_Jika butuh bantuan darurat lainnya, silakan hubungi Call Center 110 (Bebas Pulsa 24 Jam)._`
    );

    const messageText = lines.join('\n');
    const waWebUrl = `https://wa.me/${intlPhone}?text=${encodeURIComponent(messageText)}`;

    // Kirim via FlowKirim REST API
    const sendResult = await WhatsAppService.sendTicketNotification({
      pelaporHp: intlPhone,
      pelaporNama: recipientName || 'Masyarakat',
      nomorTiket: `INFO-${item.id.toUpperCase()}`,
      jenisKejadian: item.kategoriLabel,
      tkpAlamatTeks: item.lokasiPelayanan,
      customMessage: messageText,
    });

    if (sendResult.success) {
      return {
        success: true,
        message: `Panduan "${item.judul}" berhasil dikirim ke WhatsApp ${phone}.`,
        waWebUrl,
      };
    } else {
      return {
        success: false,
        message: sendResult.error || 'Gagal mengirim pesan WhatsApp via Gateway.',
        error: sendResult.error,
        waWebUrl,
      };
    }
  } catch (error: any) {
    console.error('[sendKnowledgeFaqWhatsAppAction] Error:', error);
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan sistem saat mengirim WhatsApp.',
      error: error.message,
    };
  }
}

// ── CRUD MASTER PANDUAN SOP & FAQ (UNTUK SUPERADMIN) ─────────────────────────

export interface MasterFaqInput {
  id?: number;
  slug: string;
  kategori: string;
  kategori_label: string;
  icon?: string;
  judul: string;
  subjudul: string;
  tags: string[];
  persyaratan: string[];
  prosedur: string[];
  biaya_pnbp: string;
  lokasi_pelayanan: string;
  jam_operasional: string;
  waktu_penyelesaian: string;
  script_operator: string;
  kontak_penting?: string;
  is_active?: boolean;
  display_order?: number;
}

function serialize<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

export async function getAllMasterFaqsAction() {
  try {
    let list = await prisma.masterKnowledgeFaq.findMany({
      orderBy: { display_order: 'asc' },
    });

    // Auto-seed jika tabel masih kosong
    if (!list || list.length === 0) {
      try {
        const { seedKnowledgeFaqs } = await import('../../../prisma/seed_knowledge_faqs');
        await seedKnowledgeFaqs();
        list = await prisma.masterKnowledgeFaq.findMany({
          orderBy: { display_order: 'asc' },
        });
      } catch (seedErr) {
        console.warn('[getAllMasterFaqsAction] Auto-seed warning:', seedErr);
      }
    }

    return { success: true, data: serialize(list) };
  } catch (e: any) {
    return { success: false, error: e.message, data: [] };
  }
}

export async function createMasterFaqAction(input: MasterFaqInput) {
  try {
    const created = await prisma.masterKnowledgeFaq.create({
      data: {
        slug: input.slug,
        kategori: input.kategori,
        kategori_label: input.kategori_label,
        icon: input.icon || '📖',
        judul: input.judul,
        subjudul: input.subjudul,
        tags: JSON.stringify(input.tags || []),
        persyaratan: JSON.stringify(input.persyaratan || []),
        prosedur: JSON.stringify(input.prosedur || []),
        biaya_pnbp: input.biaya_pnbp,
        lokasi_pelayanan: input.lokasi_pelayanan,
        jam_operasional: input.jam_operasional,
        waktu_penyelesaian: input.waktu_penyelesaian,
        script_operator: input.script_operator,
        kontak_penting: input.kontak_penting || null,
        is_active: input.is_active ?? true,
        display_order: input.display_order ?? 1,
      },
    });
    return { success: true, data: serialize(created) };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateMasterFaqAction(id: number, input: Partial<MasterFaqInput>) {
  try {
    const dataToUpdate: any = {};
    if (input.slug !== undefined) dataToUpdate.slug = input.slug;
    if (input.kategori !== undefined) dataToUpdate.kategori = input.kategori;
    if (input.kategori_label !== undefined) dataToUpdate.kategori_label = input.kategori_label;
    if (input.icon !== undefined) dataToUpdate.icon = input.icon;
    if (input.judul !== undefined) dataToUpdate.judul = input.judul;
    if (input.subjudul !== undefined) dataToUpdate.subjudul = input.subjudul;
    if (input.tags !== undefined) dataToUpdate.tags = JSON.stringify(input.tags);
    if (input.persyaratan !== undefined) dataToUpdate.persyaratan = JSON.stringify(input.persyaratan);
    if (input.prosedur !== undefined) dataToUpdate.prosedur = JSON.stringify(input.prosedur);
    if (input.biaya_pnbp !== undefined) dataToUpdate.biaya_pnbp = input.biaya_pnbp;
    if (input.lokasi_pelayanan !== undefined) dataToUpdate.lokasi_pelayanan = input.lokasi_pelayanan;
    if (input.jam_operasional !== undefined) dataToUpdate.jam_operasional = input.jam_operasional;
    if (input.waktu_penyelesaian !== undefined) dataToUpdate.waktu_penyelesaian = input.waktu_penyelesaian;
    if (input.script_operator !== undefined) dataToUpdate.script_operator = input.script_operator;
    if (input.kontak_penting !== undefined) dataToUpdate.kontak_penting = input.kontak_penting;
    if (input.is_active !== undefined) dataToUpdate.is_active = input.is_active;
    if (input.display_order !== undefined) dataToUpdate.display_order = input.display_order;

    const updated = await prisma.masterKnowledgeFaq.update({
      where: { id },
      data: dataToUpdate,
    });
    return { success: true, data: serialize(updated) };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteMasterFaqAction(id: number) {
  try {
    await prisma.masterKnowledgeFaq.delete({
      where: { id },
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function toggleMasterFaqStatusAction(id: number) {
  try {
    const existing = await prisma.masterKnowledgeFaq.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'Data tidak ditemukan' };

    const updated = await prisma.masterKnowledgeFaq.update({
      where: { id },
      data: { is_active: !existing.is_active },
    });
    return { success: true, data: serialize(updated) };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── CRUD MASTER KATEGORI SOP & FAQ ───────────────────────────────────────────

export interface MasterFaqCategoryInput {
  id?: number;
  key: string;
  label: string;
  icon?: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
}

export async function getMasterFaqCategoriesAction() {
  try {
    const list = await prisma.masterKnowledgeFaqCategory.findMany({
      orderBy: { display_order: 'asc' },
    });
    return { success: true, data: serialize(list) };
  } catch (e: any) {
    return { success: false, error: e.message, data: [] };
  }
}

export async function createMasterFaqCategoryAction(input: MasterFaqCategoryInput) {
  try {
    const created = await prisma.masterKnowledgeFaqCategory.create({
      data: {
        key: input.key,
        label: input.label,
        icon: input.icon || '📖',
        description: input.description || null,
        display_order: input.display_order ?? 1,
        is_active: input.is_active ?? true,
      },
    });
    return { success: true, data: serialize(created) };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateMasterFaqCategoryAction(id: number, input: Partial<MasterFaqCategoryInput>) {
  try {
    const updated = await prisma.masterKnowledgeFaqCategory.update({
      where: { id },
      data: input,
    });
    return { success: true, data: serialize(updated) };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteMasterFaqCategoryAction(id: number) {
  try {
    await prisma.masterKnowledgeFaqCategory.delete({ where: { id } });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
