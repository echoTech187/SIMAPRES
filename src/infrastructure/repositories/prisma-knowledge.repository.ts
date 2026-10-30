/**
 * SIMAPRES 110 - INFRASTRUCTURE REPOSITORY: KNOWLEDGE BASE & SOP
 * Lapisan: Infrastructure (Prisma Implementation)
 */

import { prisma } from '../db/prisma.client';
import {
  IKnowledgeRepository,
  KnowledgeFaqItem,
  KnowledgeCategoryItem,
  MasterKnowledgeFaqRecord,
  MasterKnowledgeFaqCategoryRecord,
  CreateKnowledgeArticleInput,
  UpdateKnowledgeArticleInput,
  CreateKnowledgeCategoryInput,
  UpdateKnowledgeCategoryInput,
} from '@/domain/repositories/knowledge.repository.interface';
import { WhatsAppService } from '../services/whatsapp.service';

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export class PrismaKnowledgeRepository implements IKnowledgeRepository {
  async getKnowledgeItems(searchQuery?: string, categoryFilter?: string): Promise<{
    items: KnowledgeFaqItem[];
    categories: KnowledgeCategoryItem[];
    total: number;
  }> {
    const [dbRows, masterCats] = await Promise.all([
      prisma.masterKnowledgeFaq.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }),
      prisma.masterKnowledgeFaqCategory.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }).catch(() => []),
    ]);

    let rows = dbRows || [];
    if (!rows || rows.length === 0) {
      try {
        const { seedKnowledgeFaqs } = await import('../../../prisma/seed_knowledge_faqs');
        await seedKnowledgeFaqs();
        rows = await prisma.masterKnowledgeFaq.findMany({
          where: { is_active: true },
          orderBy: { display_order: 'asc' },
        });
      } catch (seedErr) {
        console.warn('[PrismaKnowledgeRepository] Auto-seed warning:', seedErr);
      }
    }

    const countMap = new Map<string, number>();
    rows.forEach((it) => {
      countMap.set(it.kategori, (countMap.get(it.kategori) || 0) + 1);
    });

    const categories: KnowledgeCategoryItem[] = masterCats.map((mc) => ({
      key: mc.key,
      label: mc.label,
      icon: mc.icon || '📖',
      count: countMap.get(mc.key) || 0,
    }));

    if (categoryFilter && categoryFilter !== 'ALL') {
      rows = rows.filter((r) => r.kategori === categoryFilter);
    }

    let items: KnowledgeFaqItem[] = rows.map((row) => ({
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
    }));

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

    return {
      items,
      categories,
      total: items.length,
    };
  }

  async getArticleBySlug(slug: string): Promise<MasterKnowledgeFaqRecord | null> {
    return await prisma.masterKnowledgeFaq.findFirst({
      where: { slug, is_active: true },
    });
  }

  async sendWhatsAppSop(targetPhone: string, slug: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const item = await this.getArticleBySlug(slug);
    if (!item) {
      return { success: false, error: 'Panduan tidak ditemukan' };
    }

    const text = `*LAYANAN INFORMASI POLRI 110*\n*SOP: ${item.judul}*\n\n${item.subjudul}\n\n• Biaya PNBP: ${item.biaya_pnbp}\n• Waktu: ${item.waktu_penyelesaian}\n• Lokasi: ${item.lokasi_pelayanan}\n\n_Pesan otomatis SIMAPRES 110_`;
    const res = await WhatsAppService.sendTicketNotification({
      pelaporHp: targetPhone,
      pelaporNama: 'Masyarakat',
      nomorTiket: `INFO-${item.id}`,
      customMessage: text,
    });
    return { success: res.success, error: res.error };
  }

  async createArticle(data: CreateKnowledgeArticleInput): Promise<MasterKnowledgeFaqRecord> {
    return await prisma.masterKnowledgeFaq.create({
      data: {
        slug: data.slug,
        kategori: data.kategori,
        kategori_label: data.kategori_label,
        icon: data.icon || '📖',
        judul: data.judul,
        subjudul: data.subjudul,
        tags: JSON.stringify(data.tags || []),
        persyaratan: JSON.stringify(data.persyaratan || []),
        prosedur: JSON.stringify(data.prosedur || []),
        biaya_pnbp: data.biaya_pnbp,
        lokasi_pelayanan: data.lokasi_pelayanan,
        jam_operasional: data.jam_operasional,
        waktu_penyelesaian: data.waktu_penyelesaian,
        script_operator: data.script_operator,
        kontak_penting: data.kontak_penting || null,
        is_active: data.is_active ?? true,
        display_order: data.display_order ?? 1,
      },
    });
  }

  async updateArticle(id: number, data: UpdateKnowledgeArticleInput): Promise<MasterKnowledgeFaqRecord> {
    return await prisma.masterKnowledgeFaq.update({
      where: { id },
      data: {
        slug: data.slug,
        kategori: data.kategori,
        kategori_label: data.kategori_label,
        icon: data.icon || '📖',
        judul: data.judul,
        subjudul: data.subjudul,
        tags: data.tags ? JSON.stringify(data.tags) : undefined,
        persyaratan: data.persyaratan ? JSON.stringify(data.persyaratan) : undefined,
        prosedur: data.prosedur ? JSON.stringify(data.prosedur) : undefined,
        biaya_pnbp: data.biaya_pnbp,
        lokasi_pelayanan: data.lokasi_pelayanan,
        jam_operasional: data.jam_operasional,
        waktu_penyelesaian: data.waktu_penyelesaian,
        script_operator: data.script_operator,
        kontak_penting: data.kontak_penting || null,
        is_active: data.is_active,
        display_order: data.display_order,
      },
    });
  }

  async getArticleByIdOrSlug(idOrSlug: string): Promise<MasterKnowledgeFaqRecord | null> {
    return await prisma.masterKnowledgeFaq.findFirst({
      where: {
        OR: [
          { slug: idOrSlug },
          { id: !isNaN(Number(idOrSlug)) ? Number(idOrSlug) : undefined },
        ],
      },
    }).catch(() => null);
  }

  async getAllMasterFaqs(): Promise<MasterKnowledgeFaqRecord[]> {
    let list = await prisma.masterKnowledgeFaq.findMany({
      orderBy: { display_order: 'asc' },
    });

    if (!list || list.length === 0) {
      try {
        const { seedKnowledgeFaqs } = await import('../../../prisma/seed_knowledge_faqs');
        await seedKnowledgeFaqs();
        list = await prisma.masterKnowledgeFaq.findMany({
          orderBy: { display_order: 'asc' },
        });
      } catch (seedErr) {
        console.warn('[PrismaKnowledgeRepository] Auto-seed warning:', seedErr);
      }
    }

    return list;
  }

  async toggleArticleStatus(id: number): Promise<MasterKnowledgeFaqRecord | null> {
    const existing = await prisma.masterKnowledgeFaq.findUnique({ where: { id } });
    if (!existing) return null;
    return await prisma.masterKnowledgeFaq.update({
      where: { id },
      data: { is_active: !existing.is_active },
    });
  }

  async getMasterCategories(): Promise<MasterKnowledgeFaqCategoryRecord[]> {
    return await prisma.masterKnowledgeFaqCategory.findMany({
      orderBy: { display_order: 'asc' },
    });
  }

  async createCategory(data: CreateKnowledgeCategoryInput): Promise<MasterKnowledgeFaqCategoryRecord> {
    return await prisma.masterKnowledgeFaqCategory.create({
      data: {
        key: data.key,
        label: data.label,
        icon: data.icon || '📖',
        description: data.description || null,
        display_order: data.display_order ?? 1,
        is_active: data.is_active ?? true,
      },
    });
  }

  async updateCategory(id: number, data: UpdateKnowledgeCategoryInput): Promise<MasterKnowledgeFaqCategoryRecord> {
    return await prisma.masterKnowledgeFaqCategory.update({
      where: { id },
      data,
    });
  }

  async deleteCategory(id: number): Promise<boolean> {
    await prisma.masterKnowledgeFaqCategory.delete({ where: { id } });
    return true;
  }

  async deleteArticle(id: number): Promise<boolean> {
    await prisma.masterKnowledgeFaq.delete({ where: { id } });
    return true;
  }
}

