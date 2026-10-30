/**
 * SIMAPRES 110 - Master Catalog Data Buku Pintar SOP & Panduan Layanan Kepolisian
 * Sumber: Regulasi Resmi Mabes Polri, PP No. 76 Tahun 2020 (Tarif PNBP Polri), dan SOP SPKT Polres Pekalongan
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

export const KNOWLEDGE_BASE_ITEMS: KnowledgeFaqItem[] = [];
