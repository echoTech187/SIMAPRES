/**
 * SIMAPRES 110 - DOMAIN REPOSITORY INTERFACE: KNOWLEDGE BASE & SOP
 * Lapisan: Domain (Pure TypeScript, Zero Framework Dependency)
 */

export interface IKnowledgeRepository {
  getKnowledgeItems(searchQuery?: string, categoryFilter?: string): Promise<{
    items: any[];
    categories: any[];
    total: number;
  }>;
  getArticleBySlug(slug: string): Promise<any | null>;
  getArticleByIdOrSlug(idOrSlug: string): Promise<any | null>;
  sendWhatsAppSop(targetPhone: string, slug: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
  getAllMasterFaqs(): Promise<any[]>;
  createArticle(data: any): Promise<any>;
  updateArticle(id: number, data: any): Promise<any>;
  deleteArticle(id: number): Promise<boolean>;
  toggleArticleStatus(id: number): Promise<any>;
  getMasterCategories(): Promise<any[]>;
  createCategory(data: any): Promise<any>;
  updateCategory(id: number, data: any): Promise<any>;
  deleteCategory(id: number): Promise<boolean>;
}

