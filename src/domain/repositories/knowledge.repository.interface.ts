/**
 * SIMAPRES 110 - DOMAIN REPOSITORY INTERFACE: KNOWLEDGE BASE & SOP
 * Lapisan: Domain (Pure TypeScript, Zero Framework Dependency)
 */

export interface KnowledgeFaqItem {
  id: string;
  kategori: 'LANTAS_SIM' | 'SAMSAT_STNK_BPKB' | 'INTELKAM_SKCK' | 'RESKRIM_CYBER' | 'SPKT_KEHILANGAN' | 'SOP_OPERATOR_110' | (string & {});
  kategoriLabel: string;

  icon: string;
  judul: string;
  subjudul: string;
  tags: string[];
  persyaratan: string[];
  prosedur: string[];
  biayaPnbp: string;
  lokasiPelayanan: string;
  jamOperasional: string;
  waktuPenyelesaian: string;
  scriptOperator: string;
  kontakPenting?: string;
}

export interface KnowledgeCategoryItem {
  key: string;
  label: string;
  icon: string;
  count: number;
}

export interface MasterKnowledgeFaqRecord {
  id: number;
  slug: string;
  kategori: string;
  kategori_label: string;
  icon: string;
  judul: string;
  subjudul: string;
  tags: string;
  persyaratan: string;
  prosedur: string;
  biaya_pnbp: string;
  lokasi_pelayanan: string;
  jam_operasional: string;
  waktu_penyelesaian: string;
  script_operator: string;
  kontak_penting?: string | null;
  is_active: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface MasterKnowledgeFaqCategoryRecord {
  id: number;
  key: string;
  label: string;
  icon: string;
  description?: string | null;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateKnowledgeArticleInput {
  slug: string;
  kategori: string;
  kategori_label: string;
  icon?: string;
  judul: string;
  subjudul: string;
  tags?: string[];
  persyaratan?: string[];
  prosedur?: string[];
  biaya_pnbp: string;
  lokasi_pelayanan: string;
  jam_operasional: string;
  waktu_penyelesaian: string;
  script_operator: string;
  kontak_penting?: string | null;
  is_active?: boolean;
  display_order?: number;
}

export interface UpdateKnowledgeArticleInput extends Partial<CreateKnowledgeArticleInput> {}

export interface CreateKnowledgeCategoryInput {
  key: string;
  label: string;
  icon?: string;
  description?: string | null;
  display_order?: number;
  is_active?: boolean;
}

export interface UpdateKnowledgeCategoryInput extends Partial<CreateKnowledgeCategoryInput> {}

export interface IKnowledgeRepository {
  getKnowledgeItems(
    searchQuery?: string,
    categoryFilter?: string
  ): Promise<{
    items: KnowledgeFaqItem[];
    categories: KnowledgeCategoryItem[];
    total: number;
  }>;
  getArticleBySlug(slug: string): Promise<MasterKnowledgeFaqRecord | null>;
  getArticleByIdOrSlug(idOrSlug: string): Promise<MasterKnowledgeFaqRecord | null>;
  sendWhatsAppSop(targetPhone: string, slug: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
  getAllMasterFaqs(): Promise<MasterKnowledgeFaqRecord[]>;
  createArticle(data: CreateKnowledgeArticleInput): Promise<MasterKnowledgeFaqRecord>;
  updateArticle(id: number, data: UpdateKnowledgeArticleInput): Promise<MasterKnowledgeFaqRecord>;
  deleteArticle(id: number): Promise<boolean>;
  toggleArticleStatus(id: number): Promise<MasterKnowledgeFaqRecord | null>;
  getMasterCategories(): Promise<MasterKnowledgeFaqCategoryRecord[]>;
  createCategory(data: CreateKnowledgeCategoryInput): Promise<MasterKnowledgeFaqCategoryRecord>;
  updateCategory(id: number, data: UpdateKnowledgeCategoryInput): Promise<MasterKnowledgeFaqCategoryRecord>;
  deleteCategory(id: number): Promise<boolean>;
}


