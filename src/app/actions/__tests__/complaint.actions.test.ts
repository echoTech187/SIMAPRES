import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createComplaintAction, CreateComplaintActionInput } from '../complaint.actions';
import { UseCaseFactory } from '@/application/factories/use-case.factory';
import { ComplaintEntity } from '@/domain/entities/complaint.entity';
import { ComplaintNotificationDispatcher } from '@/application/services/complaint-notification.service';
import { clearAllRateLimits } from '@/infrastructure/security/rate-limiter';

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

describe('Server Action Integration: createComplaintAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAllRateLimits();
  });

  describe('Input Validation & Sanitation', () => {
    it('returns error when pelaporNama is missing', async () => {
      const res = await createComplaintAction({
        pelaporNama: '',
        pelaporHp: '081234567890',
        jenisKejadian: 'KAMTIBMAS',
        tkpAlamatTeks: 'Alun-alun Kajen',
        tkpLat: -7.026,
        tkpLng: 109.593,
        ringkasanKeterangan: 'Ada keributan',
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('Nama pelapor wajib diisi!');
    });

    it('returns error when pelaporHp is missing or placeholder', async () => {
      const res = await createComplaintAction({
        pelaporNama: 'Budi Santoso',
        pelaporHp: '-',
        jenisKejadian: 'KAMTIBMAS',
        tkpAlamatTeks: 'Alun-alun Kajen',
        tkpLat: -7.026,
        tkpLng: 109.593,
        ringkasanKeterangan: 'Ada keributan',
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('Nomor telepon / kontak pelapor wajib diisi!');
    });

    it('returns error when kategori/jenis kejadian is omitted', async () => {
      const res = await createComplaintAction({
        pelaporNama: 'Budi Santoso',
        pelaporHp: '081234567890',
        jenisKejadian: '',
        tkpAlamatTeks: 'Alun-alun Kajen',
        tkpLat: -7.026,
        tkpLng: 109.593,
        ringkasanKeterangan: 'Ada keributan',
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('Kategori / jenis kejadian laporan wajib dipilih!');
    });

    it('returns error when TKP address is omitted', async () => {
      const res = await createComplaintAction({
        pelaporNama: 'Budi Santoso',
        pelaporHp: '081234567890',
        jenisKejadian: 'LAKA',
        tkpAlamatTeks: '',
        tkpLat: -7.026,
        tkpLng: 109.593,
        ringkasanKeterangan: 'Tabrakan motor',
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('Alamat tempat kejadian perkara (TKP) wajib diisi!');
    });

    it('returns error when GPS coordinates are NaN or missing', async () => {
      const res = await createComplaintAction({
        pelaporNama: 'Budi Santoso',
        pelaporHp: '081234567890',
        jenisKejadian: 'LAKA',
        tkpAlamatTeks: 'Jl. Raya Kajen',
        tkpLat: NaN,
        tkpLng: 109.593,
        ringkasanKeterangan: 'Tabrakan motor',
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('Koordinat lokasi TKP (latitude & longitude) wajib diisi angka valid!');
    });

    it('returns error when ringkasanKeterangan is empty', async () => {
      const res = await createComplaintAction({
        pelaporNama: 'Budi Santoso',
        pelaporHp: '081234567890',
        jenisKejadian: 'LAKA',
        tkpAlamatTeks: 'Jl. Raya Kajen',
        tkpLat: -7.026,
        tkpLng: 109.593,
        ringkasanKeterangan: '',
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('Uraian ringkasan kejadian wajib diisi!');
    });
  });

  describe('Happy Path: Complaint Creation Flow', () => {
    it('executes useCase, produces serialized data with citizen tracking token and dispatches notification', async () => {
      const mockComplaintEntity = new ComplaintEntity({
        id: BigInt(789),
        nomorTiket: 'TICKET-20261030-8888',
        pelaporNama: 'Raden Danang',
        pelaporHp: '081298765432',
        jenisKejadian: 'GANGGUAN_KAMTIBMAS',
        urgensi: 'NORMAL',
        tkpAlamatTeks: 'Jl. Bahurekso No. 10',
        tkpLat: -7.025,
        tkpLng: 109.591,
        ringkasanKeterangan: 'Keributan antar pemuda di pertigaan',
        status: 'MENUNGGU',
        tahap: 1,
      });

      const mockUseCase = {
        execute: vi.fn().mockResolvedValue(mockComplaintEntity),
      };
      vi.spyOn(UseCaseFactory, 'getCreateComplaintUseCase').mockReturnValue(mockUseCase as any);
      const dispatchSpy = vi.spyOn(ComplaintNotificationDispatcher, 'dispatchAsync').mockImplementation(() => {});

      const validPayload: CreateComplaintActionInput = {
        pelaporNama: 'Raden Danang',
        pelaporHp: '081298765432',
        jenisKejadian: 'GANGGUAN_KAMTIBMAS',
        tkpAlamatTeks: 'Jl. Bahurekso No. 10',
        tkpLat: -7.025,
        tkpLng: 109.591,
        ringkasanKeterangan: 'Keributan antar pemuda di pertigaan',
      };

      const result = await createComplaintAction(validPayload);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.nomorTiket).toBe('TICKET-20261030-8888');
      expect(result.data!.trackingToken).toBeDefined();
      expect(typeof result.data!.trackingToken).toBe('string');
      // Verifikasi BigInt diserialkan menjadi string
      expect(typeof result.data!.id).toBe('string');
      expect(result.data!.id).toBe('789');

      // Verifikasi dispatch notifikasi WhatsApp terpanggil
      expect(dispatchSpy).toHaveBeenCalledWith(
        BigInt(789),
        'TICKET_CREATED',
        expect.objectContaining({
          nomorTiket: 'TICKET-20261030-8888',
          pelaporNama: 'Raden Danang',
          pelaporHp: '081298765432',
        })
      );
    });

    it('blocks rapid successive complaint submissions from the same phone number (anti-spam)', async () => {
      const mockComplaint = new ComplaintEntity({
        id: BigInt(999),
        nomorTiket: 'TICKET-SPAM-1',
        pelaporNama: 'Spam Bot',
        pelaporHp: '089999999999',
        jenisKejadian: 'GANGGUAN_KAMTIBMAS',
        urgensi: 'NORMAL',
        tkpAlamatTeks: 'Alun-alun',
        tkpLat: -7.025,
        tkpLng: 109.591,
        ringkasanKeterangan: 'Test Spam',
        status: 'MENUNGGU',
        tahap: 1,
      });

      const mockUseCase = {
        execute: vi.fn().mockResolvedValue(mockComplaint),
      };
      vi.spyOn(UseCaseFactory, 'getCreateComplaintUseCase').mockReturnValue(mockUseCase as any);
      vi.spyOn(ComplaintNotificationDispatcher, 'dispatchAsync').mockImplementation(() => {});

      const payload: CreateComplaintActionInput = {
        pelaporNama: 'Spam Bot',
        pelaporHp: '089999999999',
        jenisKejadian: 'GANGGUAN_KAMTIBMAS',
        tkpAlamatTeks: 'Alun-alun',
        tkpLat: -7.025,
        tkpLng: 109.591,
        ringkasanKeterangan: 'Test Spam',
      };

      // 5 submissions allowed
      for (let i = 0; i < 5; i++) {
        const res = await createComplaintAction(payload);
        expect(res.success).toBe(true);
      }

      // The 6th submission must be blocked by rate-limiter
      const blockedRes = await createComplaintAction(payload);
      expect(blockedRes.success).toBe(false);
      expect(blockedRes.error).toContain('Batas pengiriman laporan tercapai');
    });
  });
});
