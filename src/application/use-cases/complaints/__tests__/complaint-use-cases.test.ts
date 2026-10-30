import { describe, it, expect, vi } from 'vitest';
import { CreateComplaintUseCase } from '../create-complaint.use-case';
import { DispatchComplaintUseCase } from '../dispatch-complaint.use-case';
import { SubmitRatingUseCase } from '../submit-rating.use-case';
import { IComplaintRepository } from '@/domain/repositories/complaint.repository.interface';
import { IOfficerRepository } from '@/domain/repositories/officer.repository.interface';
import { ComplaintEntity } from '@/domain/entities/complaint.entity';
import { OfficerEntity } from '@/domain/entities/officer.entity';

describe('Complaints Use Cases Suite (Create, Dispatch, & Rating)', () => {
  const createMockComplaint = (status: any = 'MENUNGGU', nomorTiket = 'TICKET-TEST-100') =>
    new ComplaintEntity({
      id: BigInt(100),
      nomorTiket,
      pelaporNama: 'Siti Aminah',
      pelaporHp: '081298765432',
      jenisKejadian: 'GANGGUAN_KAMTIBMAS',
      urgensi: 'NORMAL',
      tkpAlamatTeks: 'Jl. Manduro No. 5 Kajen',
      tkpLat: -7.025,
      tkpLng: 109.592,
      ringkasanKeterangan: 'Ada keramaian pemuda membunyikan petasan',
      status,
      tahap: 1,
    });

  const createMockOfficer = () =>
    new OfficerEntity({
      id: BigInt(77),
      userId: BigInt(201),
      nrp: '99010077',
      rankPangkat: 'Bripka',
      jabatan: 'Unit Patroli Samapta',
      dutyStatus: 'DINAS_PATROLI',
      kpiScore: 100,
    });

  const createMockComplaintRepo = (overrides: Partial<IComplaintRepository> = {}): IComplaintRepository => ({
    findById: vi.fn(),
    findByNomorTiket: vi.fn(),
    findByPelaporHp: vi.fn(),
    findAssignedToOfficer: vi.fn(),
    findAntreanPawas: vi.fn(),
    findAllRecent: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    getIkmStats: vi.fn(),
    ...overrides,
  });

  const createMockOfficerRepo = (overrides: Partial<IOfficerRepository> = {}): IOfficerRepository => ({
    findById: vi.fn(),
    findByNrp: vi.fn(),
    findByUserId: vi.fn(),
    findByDeviceId: vi.fn(),
    findActiveOnDuty: vi.fn(),
    updateLocation: vi.fn(),
    updateDutyStatus: vi.fn(),
    updateKpiScore: vi.fn(),
    getPatrolFleet: vi.fn(),
    ...overrides,
  });

  describe('CreateComplaintUseCase', () => {
    it('validates mandatory inputs and rejects missing fields', async () => {
      const mockRepo = createMockComplaintRepo();
      const useCase = new CreateComplaintUseCase(mockRepo);

      // 1. Missing nama
      await expect(
        useCase.execute({
          pelaporNama: '',
          pelaporHp: '0812345678',
          jenisKejadian: 'LAKA',
          tkpAlamatTeks: 'Alamat',
          tkpLat: -7.0,
          tkpLng: 109.0,
          ringkasanKeterangan: 'Ket',
        })
      ).rejects.toThrow('Nama pelapor wajib diisi.');

      // 2. Missing HP
      await expect(
        useCase.execute({
          pelaporNama: 'Budi',
          pelaporHp: '-',
          jenisKejadian: 'LAKA',
          tkpAlamatTeks: 'Alamat',
          tkpLat: -7.0,
          tkpLng: 109.0,
          ringkasanKeterangan: 'Ket',
        })
      ).rejects.toThrow('Nomor telepon / kontak pelapor wajib diisi.');

      // 3. Invalid Coordinates
      await expect(
        useCase.execute({
          pelaporNama: 'Budi',
          pelaporHp: '0812345678',
          jenisKejadian: 'LAKA',
          tkpAlamatTeks: 'Alamat',
          tkpLat: NaN,
          tkpLng: 109.0,
          ringkasanKeterangan: 'Ket',
        })
      ).rejects.toThrow('Koordinat TKP (latitude & longitude) wajib berupa angka valid.');
    });

    it('rejects duplicate ticket number if already registered', async () => {
      const mockRepo = createMockComplaintRepo({
        findByNomorTiket: vi.fn().mockResolvedValue(createMockComplaint()),
      });
      const useCase = new CreateComplaintUseCase(mockRepo);

      await expect(
        useCase.execute({
          nomorTiket: 'TICKET-TEST-100',
          pelaporNama: 'Budi',
          pelaporHp: '0812345678',
          jenisKejadian: 'LAKA',
          tkpAlamatTeks: 'Alamat',
          tkpLat: -7.0,
          tkpLng: 109.0,
          ringkasanKeterangan: 'Ket',
        })
      ).rejects.toThrow(/sudah terdaftar di pangkalan data/);
    });

    it('successfully creates new complaint with generated ticket number', async () => {
      const mockRepo = createMockComplaintRepo({
        findByNomorTiket: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockImplementation(async (e) => e),
      });
      const useCase = new CreateComplaintUseCase(mockRepo);

      const result = await useCase.execute({
        pelaporNama: 'Ahmad Dahlan',
        pelaporHp: '081234567890',
        jenisKejadian: 'KAMTIBMAS',
        tkpAlamatTeks: 'Alun-alun Kajen',
        tkpLat: -7.026,
        tkpLng: 109.593,
        ringkasanKeterangan: 'Pengaduan suara bising',
      });

      expect(mockRepo.create).toHaveBeenCalledOnce();
      expect(result.pelaporNama).toBe('Ahmad Dahlan');
      expect(result.status).toBe('MENUNGGU');
      expect(result.nomorTiket).toBeDefined();
    });
  });

  describe('DispatchComplaintUseCase', () => {
    it('dispatches complaint to active field officer and logs DISPATCH_ISSUED timeline', async () => {
      const existingComplaint = createMockComplaint('MENUNGGU');
      const mockOfficer = createMockOfficer();

      const mockComplaintRepo = createMockComplaintRepo({
        findById: vi.fn().mockResolvedValue(existingComplaint),
        update: vi.fn().mockImplementation(async (c) => c),
      });

      const mockOfficerRepo = createMockOfficerRepo({
        findById: vi.fn().mockResolvedValue(mockOfficer),
      });

      const useCase = new DispatchComplaintUseCase(mockComplaintRepo, mockOfficerRepo);

      const updated = await useCase.execute({
        complaintId: BigInt(100),
        assignedOfficerId: BigInt(77),
        pawasUserId: BigInt(99),
        arahanPawas: 'Segera meluncur ke TKP dan amankan lokasi',
      });

      expect(updated.status).toBe('DIPROSES');
      expect(updated.assignedOfficerId).toBe(BigInt(77));
      expect(updated.timelines.length).toBeGreaterThan(0);
      const latest = updated.timelines[updated.timelines.length - 1];
      expect(latest.actionKey).toBe('DISPATCH_ISSUED');
      expect(latest.catatan).toBe('Segera meluncur ke TKP dan amankan lokasi');
    });

    it('throws error if complaint or officer is not found', async () => {
      const mockComplaintRepo = createMockComplaintRepo({
        findById: vi.fn().mockResolvedValue(null),
      });
      const mockOfficerRepo = createMockOfficerRepo({
        findById: vi.fn().mockResolvedValue(null),
      });

      const useCase = new DispatchComplaintUseCase(mockComplaintRepo, mockOfficerRepo);

      await expect(
        useCase.execute({
          complaintId: BigInt(999),
          assignedOfficerId: BigInt(77),
          pawasUserId: BigInt(99),
        })
      ).rejects.toThrow('Pengaduan dengan ID 999 tidak ditemukan.');
    });
  });

  describe('SubmitRatingUseCase', () => {
    it('allows citizen to submit rating once complaint is SELESAI', async () => {
      const finishedComplaint = createMockComplaint('SELESAI');
      const mockRepo = createMockComplaintRepo({
        findByNomorTiket: vi.fn().mockResolvedValue(finishedComplaint),
        update: vi.fn().mockImplementation(async (c) => c),
      });

      const useCase = new SubmitRatingUseCase(mockRepo);

      const result = await useCase.execute({
        nomorTiket: 'TICKET-TEST-100',
        rating: 5,
        review: 'Petugas sangat cepat dan ramah!',
        tags: 'Cepat,Responsif,Sopan',
      });

      expect(result.citizenRating).toBe(5);
      expect(result.citizenReview).toBe('Petugas sangat cepat dan ramah!');
      expect(result.citizenTags).toBe('Cepat,Responsif,Sopan');
      expect(mockRepo.update).toHaveBeenCalledOnce();
    });

    it('rejects rating submission if complaint is still in progress (MENUNGGU/DIPROSES)', async () => {
      const inProgressComplaint = createMockComplaint('DIPROSES');
      const mockRepo = createMockComplaintRepo({
        findByNomorTiket: vi.fn().mockResolvedValue(inProgressComplaint),
      });

      const useCase = new SubmitRatingUseCase(mockRepo);

      await expect(
        useCase.execute({
          nomorTiket: 'TICKET-TEST-100',
          rating: 5,
        })
      ).rejects.toThrow('Rating hanya dapat diberikan pada pengaduan yang telah tuntas selesai.');
    });
  });
});
