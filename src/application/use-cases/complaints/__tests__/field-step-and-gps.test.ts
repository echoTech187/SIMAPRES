import { describe, it, expect, vi } from 'vitest';
import { FieldStepActionUseCase } from '../field-step-action.use-case';
import { ComplaintEntity } from '@/domain/entities/complaint.entity';
import { IComplaintRepository } from '@/domain/repositories/complaint.repository.interface';

describe('Anti-Fake GPS & Field Step Action Lifecycle', () => {
  const createMockComplaint = (status = 'DIPROSES', tahap = 2): ComplaintEntity =>
    new ComplaintEntity({
      id: BigInt(501),
      nomorTiket: 'TICKET-20261030-001',
      pelaporNama: 'Budi Santoso',
      pelaporHp: '081234567890',
      jenisKejadian: 'KERIBUTAN_WARGA',
      urgensi: 'DARURAT',
      tkpAlamatTeks: 'Alun-alun Kajen, Kabupaten Pekalongan',
      tkpLat: -7.026779,
      tkpLng: 109.59308,
      ringkasanKeterangan: 'Terjadi pertengkaran antar pemuda di Alun-alun',
      status,
      tahap,
      assignedOfficerId: BigInt(88),
      createdAt: new Date(),
    });

  const createMockRepo = (complaint: ComplaintEntity): IComplaintRepository => ({
    findById: vi.fn().mockResolvedValue(complaint),
    findByNomorTiket: vi.fn(),
    findByPelaporHp: vi.fn(),
    findAssignedToOfficer: vi.fn(),
    findAntreanPawas: vi.fn(),
    findAllRecent: vi.fn(),
    create: vi.fn(),
    update: vi.fn().mockImplementation(async (c) => c),
    getIkmStats: vi.fn(),
  });

  it('allows assigned officer to Meluncur (DEPARTED) from preparation stage', async () => {
    const complaint = createMockComplaint('DIPROSES', 2);
    const mockRepo = createMockRepo(complaint);
    const useCase = new FieldStepActionUseCase(mockRepo);

    const result = await useCase.execute({
      complaintId: BigInt(501),
      officerId: BigInt(88),
      step: 'DEPARTED',
      catatan: 'Tim Patroli meluncur dengan Randis Sedan Sabhara',
      lat: -7.025,
      lng: 109.591,
    });

    expect(result.tahap).toBe(3);
    expect(mockRepo.update).toHaveBeenCalled();
  });

  it('detects GPS discrepancy (Anti-Fake GPS) when officer coordinates deviate from TKP', async () => {
    const complaint = createMockComplaint('DIPROSES', 3);
    const mockRepo = createMockRepo(complaint);
    const useCase = new FieldStepActionUseCase(mockRepo);

    // Petugas tiba di lokasi tapi GPS terdeteksi deviasi 1.200 meter dari TKP
    const result = await useCase.execute({
      complaintId: BigInt(501),
      officerId: BigInt(88),
      step: 'ARRIVED',
      catatan: 'Petugas tiba di lokasi kejadian',
      fotoBuktiUrl: 'https://storage.polri.go.id/evidences/photo1.jpg',
      lat: -7.035,
      lng: 109.605,
      isDiscrepancy: true,
      deviationMeters: 1250,
      warningMessage: 'Peringatan: Koordinat petugas berjarak 1.250m dari titik TKP pelapor!',
    });

    expect(result.tahap).toBe(4);
    // Verifikasi timeline step mencatat discrepancy & deviasi jarak
    const lastTimeline = result.timelines[result.timelines.length - 1];
    expect(lastTimeline.isDiscrepancy).toBe(true);
    expect(lastTimeline.deviationMeters).toBe(1250);
    expect(lastTimeline.warningMessage).toContain('1.250m');
  });

  it('rejects premature Tiba di TKP when ticket has not departed (still in MENUNGGU)', async () => {
    const complaint = createMockComplaint('MENUNGGU', 1);
    const mockRepo = createMockRepo(complaint);
    const useCase = new FieldStepActionUseCase(mockRepo);

    await expect(
      useCase.execute({
        complaintId: BigInt(501),
        officerId: BigInt(88),
        step: 'ARRIVED',
        catatan: 'Mencoba lompat tahap langsung tiba',
      })
    ).rejects.toThrow('Aksi Tiba di TKP ditolak oleh aturan domain');
  });

  it('validates resolution documents when submitting report at TKP', async () => {
    const complaint = createMockComplaint('DIPROSES', 4);
    const mockRepo = createMockRepo(complaint);
    const useCase = new FieldStepActionUseCase(mockRepo);

    // Gagal jika catatan resolusi kosong atau kurang dari 10 karakter
    await expect(
      useCase.execute({
        complaintId: BigInt(501),
        officerId: BigInt(88),
        step: 'REPORT_SUBMITTED',
        resolutionLocationKey: 'TKP',
        resolutionDocumentKey: 'BAP_DAMAI',
        catatan: 'pendek', // < 10 karakter
        fotoBuktiUrl: 'https://storage.polri.go.id/evidence.jpg',
      })
    ).rejects.toThrow('Validasi Berita Acara Gagal');
  });
});
