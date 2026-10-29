import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getKnowledgeBaseItemsAction } from '../knowledge.actions';
import { prisma } from '@/infrastructure/db/prisma.client';

describe('Server Action Integration: knowledge.actions (Police SOP & FAQ Knowledge Base)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getKnowledgeBaseItemsAction: retrieves active SOP articles and categories from database', async () => {
    const mockFaqs = [
      {
        id: 1,
        slug: 'sop-laka-lantas',
        kategori: 'LANTAS',
        kategori_label: 'Lalu Lintas',
        icon: '🚗',
        judul: 'SOP Penanganan Kecelakaan Lalu Lintas',
        subjudul: 'Prosedur olah TKP & evakuasi korban',
        tags: '["laka", "tabrakan", "korban"]',
        persyaratan: '["KTP Pelapor", "Posisi Kendaraan"]',
        prosedur: '["Amankan TKP", "Tolong korban", "Beri tanda pilok"]',
        biaya_pnbp: 'Gratis',
        lokasi_pelayanan: 'Polsek / Pos Lantas',
        jam_operasional: '24 Jam',
        waktu_penyelesaian: '30 Menit',
        script_operator: 'Selamat pagi, mohon pastikan posisi aman...',
        kontak_penting: '110',
        is_active: true,
      },
    ];

    const mockCategories = [
      {
        id: 1,
        key: 'LANTAS',
        label: 'Lalu Lintas',
        icon: '🚗',
        is_active: true,
        display_order: 1,
      },
    ];

    vi.spyOn(prisma.masterKnowledgeFaq, 'findMany').mockResolvedValue(mockFaqs as any);
    vi.spyOn(prisma.masterKnowledgeFaqCategory, 'findMany').mockResolvedValue(mockCategories as any);

    const result = await getKnowledgeBaseItemsAction();

    expect(result.success).toBe(true);
    expect(result.data.length).toBe(1);
    expect(result.data[0].id).toBe('sop-laka-lantas');
    expect(result.data[0].judul).toBe('SOP Penanganan Kecelakaan Lalu Lintas');
    expect(result.categories.length).toBe(1);
    expect(result.categories[0].key).toBe('LANTAS');
    expect(result.categories[0].count).toBe(1);
  });
});
