import { describe, it, expect, vi } from 'vitest';
import { CalculateCadDispatchUseCase } from '../calculate-cad-dispatch.use-case';
import { IOfficerRepository } from '@/domain/repositories/officer.repository.interface';
import { OfficerEntity } from '@/domain/entities/officer.entity';

describe('CAD Dispatch Recommendation & SOP Routing Algorithm', () => {
  const mockOfficers: OfficerEntity[] = [
    new OfficerEntity({
      id: BigInt(1),
      userId: BigInt(101),
      nrp: '88010001',
      rankPangkat: 'Bripka',
      jabatan: 'Unit Turjawali Sat Lantas',
      assignedPatrolVehicle: 'Sedan Patroli 110-Lantas',
      currentGpsLat: -7.020,
      currentGpsLng: 109.590,
      dutyStatus: 'DINAS_PATROLI',
      kpiScore: 100,
    }),
    new OfficerEntity({
      id: BigInt(2),
      userId: BigInt(102),
      nrp: '88010002',
      rankPangkat: 'Aipda',
      jabatan: 'Unit Raimas Sabhara',
      assignedPatrolVehicle: 'Double Cabin Sabhara Presisi',
      currentGpsLat: -7.025,
      currentGpsLng: 109.592,
      dutyStatus: 'DINAS_PATROLI',
      kpiScore: 100,
    }),
    new OfficerEntity({
      id: BigInt(3),
      userId: BigInt(103),
      nrp: '88010003',
      rankPangkat: 'Briptu',
      jabatan: 'Unit Resmob / Kring Serse',
      assignedPatrolVehicle: 'Mobil Inafis & Opsnal',
      currentGpsLat: -7.030,
      currentGpsLng: 109.600,
      dutyStatus: 'DINAS_PATROLI',
      kpiScore: 100,
    }),
    new OfficerEntity({
      id: BigInt(4),
      userId: BigInt(104),
      nrp: '88010004',
      rankPangkat: 'Aiptu',
      jabatan: 'Bhabinkamtibmas Polsek Kajen',
      assignedPatrolVehicle: 'Sepeda Motor Dinas Bhabin',
      currentGpsLat: -7.027,
      currentGpsLng: 109.594,
      dutyStatus: 'DINAS_PATROLI',
      kpiScore: 100,
    }),
  ];

  const createMockOfficerRepo = (): IOfficerRepository => ({
    findActiveOnDuty: vi.fn().mockResolvedValue(mockOfficers),
    findById: vi.fn(),
    findByNrp: vi.fn(),
    findByUserId: vi.fn(),
    findByDeviceId: vi.fn(),
    updateLocation: vi.fn(),
    updateDutyStatus: vi.fn(),
    updateKpiScore: vi.fn(),
  });

  it('routes traffic accident (laka lantas / tabrakan) primarily to Sat Lantas', async () => {
    const mockRepo = createMockOfficerRepo();
    const useCase = new CalculateCadDispatchUseCase(mockRepo);

    const recommendations = await useCase.execute(
      'Terjadi laka lantas tabrakan sepeda motor dengan truk',
      -7.026779,
      109.59308
    );

    expect(recommendations.length).toBeGreaterThan(0);
    // Rekomendasi peringkat pertama harus Sat Lantas
    expect(recommendations[0].satuan.toLowerCase()).toContain('lantas');
    expect(recommendations[0].isPrimarySop).toBe(true);
    expect(recommendations[0].sopAlasan).toContain('Lalu Lintas');
  });

  it('routes criminal offenses (curanmor / begal / sajam) primarily to Sat Reskrim', async () => {
    const mockRepo = createMockOfficerRepo();
    const useCase = new CalculateCadDispatchUseCase(mockRepo);

    const recommendations = await useCase.execute(
      'Ada komplotan begal membawa sajam di jalan raya',
      -7.026779,
      109.59308
    );

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0].satuan.toLowerCase()).toContain('reskrim');
    expect(recommendations[0].isPrimarySop).toBe(true);
    expect(recommendations[0].sopAlasan).toContain('Reskrim');
  });

  it('routes community dispute (sengketa / mediasi tetangga) primarily to Sat Binmas / Bhabin', async () => {
    const mockRepo = createMockOfficerRepo();
    const useCase = new CalculateCadDispatchUseCase(mockRepo);

    const recommendations = await useCase.execute(
      'Warga berselisih sengketa batas tanah antar tetangga perlu mediasi damai',
      -7.026779,
      109.59308
    );

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0].satuan.toLowerCase()).toContain('binmas');
    expect(recommendations[0].isPrimarySop).toBe(true);
  });

  it('routes general public disturbance to Sat Samapta / Sabhara as primary default', async () => {
    const mockRepo = createMockOfficerRepo();
    const useCase = new CalculateCadDispatchUseCase(mockRepo);

    const recommendations = await useCase.execute(
      'Pemuda mabuk teriak-teriak mengganggu warga sekitar',
      -7.026779,
      109.59308
    );

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0].satuan.toLowerCase()).toContain('samapta');
    expect(recommendations[0].isPrimarySop).toBe(true);
  });

  it('calculates ETA and flags isSlaAman correctly based on distance threshold', async () => {
    const mockRepo = createMockOfficerRepo();
    const useCase = new CalculateCadDispatchUseCase(mockRepo);

    const recommendations = await useCase.execute(
      'Laporan umum kamtibmas',
      -7.026779,
      109.59308
    );

    for (const rec of recommendations) {
      expect(rec.jarakKm).toBeGreaterThanOrEqual(0);
      expect(rec.etaMenit).toBeGreaterThanOrEqual(1);
      // isSlaAman harus true jika eta <= 15 menit
      expect(rec.isSlaAman).toBe(rec.etaMenit <= 15);
    }
  });
});
