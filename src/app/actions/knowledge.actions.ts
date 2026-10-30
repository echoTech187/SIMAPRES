'use server';

import { UseCaseFactory } from '@/application/factories/use-case.factory';
import { WhatsAppService } from '@/infrastructure/services/whatsapp.service';
import { KnowledgeFaqItem } from '@/lib/knowledge-base-data';
import { cacheGetOrLoad } from '@/infrastructure/cache/app-cache';
import { requireRole } from '@/lib/session';

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

import { serializeBigInt } from '@/lib/serialization';
import { getErrorMessage } from '@/types/action.types';


/**
 * Mengambil daftar master panduan SOP & Dynamic FAQ secara dinamis dari database (Tabel master_knowledge_faqs)
 */
export async function getKnowledgeBaseItemsAction(
  searchQuery?: string,
  categoryFilter?: string
): Promise<GetKnowledgeItemsResult> {
  const cacheKey = `knowledge_base_${searchQuery || ''}_${categoryFilter || 'ALL'}`;
  try {
    return await cacheGetOrLoad(cacheKey, 300000, async () => {
      const repo = UseCaseFactory.getKnowledgeRepository();
      const res = await repo.getKnowledgeItems(searchQuery, categoryFilter);
      return {
        success: true,
        data: res.items,
        total: res.total,
        categories: res.categories,
      };
    });
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

    // 1. Ambil data item dari database via domain repository
    let item: KnowledgeFaqItem | null = null;
    const repo = UseCaseFactory.getKnowledgeRepository();
    const dbRow = await repo.getArticleByIdOrSlug(faqId);

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

    // Kirim via WhatsAppService Gateway
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

export async function getAllMasterFaqsAction() {
  try {
    const repo = UseCaseFactory.getKnowledgeRepository();
    const list = await repo.getAllMasterFaqs();
    return { success: true, data: serializeBigInt(list) };
  } catch (e: unknown) {
    return { success: false, error: getErrorMessage(e), data: [] };
  }
}

export async function createMasterFaqAction(input: MasterFaqInput) {
  const auth = await requireRole('SUPERADMIN');
  if (!auth.authorized) return { success: false, error: auth.error };

  try {
    const repo = UseCaseFactory.getKnowledgeRepository();
    const created = await repo.createArticle(input);
    return { success: true, data: serializeBigInt(created) };
  } catch (e: unknown) {
    return { success: false, error: getErrorMessage(e) };
  }
}

export async function updateMasterFaqAction(id: number, input: Partial<MasterFaqInput>) {
  const auth = await requireRole('SUPERADMIN');
  if (!auth.authorized) return { success: false, error: auth.error };

  try {
    const repo = UseCaseFactory.getKnowledgeRepository();
    const updated = await repo.updateArticle(id, input);
    return { success: true, data: serializeBigInt(updated) };
  } catch (e: unknown) {
    return { success: false, error: getErrorMessage(e) };
  }
}

export async function deleteMasterFaqAction(id: number) {
  const auth = await requireRole('SUPERADMIN');
  if (!auth.authorized) return { success: false, error: auth.error };

  try {
    const repo = UseCaseFactory.getKnowledgeRepository();
    await repo.deleteArticle(id);
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: getErrorMessage(e) };
  }
}

export async function toggleMasterFaqStatusAction(id: number) {
  const auth = await requireRole('SUPERADMIN');
  if (!auth.authorized) return { success: false, error: auth.error };

  try {
    const repo = UseCaseFactory.getKnowledgeRepository();
    const updated = await repo.toggleArticleStatus(id);
    if (!updated) return { success: false, error: 'Data tidak ditemukan' };
    return { success: true, data: serializeBigInt(updated) };
  } catch (e: unknown) {
    return { success: false, error: getErrorMessage(e) };
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
    const repo = UseCaseFactory.getKnowledgeRepository();
    const list = await repo.getMasterCategories();
    return { success: true, data: serializeBigInt(list) };
  } catch (e: unknown) {
    return { success: false, error: getErrorMessage(e), data: [] };
  }
}

export async function createMasterFaqCategoryAction(input: MasterFaqCategoryInput) {
  const auth = await requireRole('SUPERADMIN');
  if (!auth.authorized) return { success: false, error: auth.error };

  try {
    const repo = UseCaseFactory.getKnowledgeRepository();
    const created = await repo.createCategory(input);
    return { success: true, data: serializeBigInt(created) };
  } catch (e: unknown) {
    return { success: false, error: getErrorMessage(e) };
  }
}

export async function updateMasterFaqCategoryAction(id: number, input: Partial<MasterFaqCategoryInput>) {
  const auth = await requireRole('SUPERADMIN');
  if (!auth.authorized) return { success: false, error: auth.error };

  try {
    const repo = UseCaseFactory.getKnowledgeRepository();
    const updated = await repo.updateCategory(id, input);
    return { success: true, data: serializeBigInt(updated) };
  } catch (e: unknown) {
    return { success: false, error: getErrorMessage(e) };
  }
}

export async function deleteMasterFaqCategoryAction(id: number) {
  const auth = await requireRole('SUPERADMIN');
  if (!auth.authorized) return { success: false, error: auth.error };

  try {
    const repo = UseCaseFactory.getKnowledgeRepository();
    await repo.deleteCategory(id);
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: getErrorMessage(e) };
  }
}
