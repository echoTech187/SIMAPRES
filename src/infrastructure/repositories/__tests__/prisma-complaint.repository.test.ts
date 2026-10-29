import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaComplaintRepository } from '../prisma-complaint.repository';
import { prisma } from '../../db/prisma.client';
import { ComplaintEntity } from '@/domain/entities/complaint.entity';

describe('PrismaComplaintRepository Integration Tests', () => {
  let repository: PrismaComplaintRepository;

  const mockDbComplaint = {
    id: BigInt(100),
    nomor_tiket: 'TICKET-20261030-9999',
    pelapor_nama: 'Budi Santoso',
    pelapor_hp: '081234567890',
    jenis_kejadian: 'GANGGUAN_KAMTIBMAS',
    urgensi: 'NORMAL',
    category_id: 1,
    kategori_key: 'KAMTIBMAS',
    subcategory_id: null,
    source_id: 1,
    platform_key: 'warga',
    tkp_alamat_teks: 'Jl. Manduro No. 5 Kajen',
    tkp_lat: -7.0267,
    tkp_lng: 109.593,
    ringkasan_keterangan: 'Ada keramaian pemuda membunyikan petasan',
    status: 'DIPROSES',
    tahap: 3,
    alasan_tolak: null,
    operator_id: BigInt(5),
    created_at: new Date('2026-10-30T01:00:00Z'),
    updated_at: new Date('2026-10-30T02:00:00Z'),
    complaint_logs: [
      {
        id: BigInt(1),
        actor_name: 'Operator 110',
        actor_role: 'OPERATOR',
        action: 'Tiket Pengaduan Diterbitkan',
        notes: 'Laporan diterima via Call Center 110',
        action_lat: null,
        action_lng: null,
        created_at: new Date('2026-10-30T01:00:00Z'),
      },
      {
        id: BigInt(2),
        actor_name: 'Pawas Iptu Bambang',
        actor_role: 'PAWAS',
        action: 'Disposisi Pawas',
        notes: 'Segera meluncur ke TKP',
        action_lat: null,
        action_lng: null,
        created_at: new Date('2026-10-30T01:05:00Z'),
      },
    ],
    dispatches: [
      {
        id: BigInt(10),
        complaint_id: BigInt(100),
        unit_id: 1,
        officer_id: BigInt(88),
        is_primary_unit: true,
        dispatch_status: 'DEPARTED',
        dispatched_at: new Date('2026-10-30T01:05:00Z'),
        accepted_at: new Date('2026-10-30T01:06:00Z'),
        departed_at: new Date('2026-10-30T01:07:00Z'),
        arrived_at: null,
        completed_at: null,
        officer: {
          id: BigInt(88),
          nrp: '88010088',
          rank_pangkat: 'Aipda',
          jabatan: 'Unit Turjawali Sat Lantas',
          avatar_url: 'https://avatar.png',
          assigned_patrol_vehicle: 'Sedan Lantas 110',
          current_gps_lat: -7.0267,
          current_gps_lng: 109.593,
          user: {
            full_name: 'Aipda Agus',
            phone_number: '081234567890',
          },
        },
        unit: {
          id: 1,
          unit_name: 'Satuan Lalu Lintas',
          short_name: 'Sat Lantas',
        },
      },
    ],
    evidences: [
      {
        id: BigInt(1),
        incident_phase: 'LAPORAN_AWAL',
        file_url: 'https://foto.jpg',
        caption: 'Kondisi TKP',
        uploaded_at: new Date('2026-10-30T01:00:00Z'),
      },
    ],
    citizen_review_rel: null,
    operator: {
      id: BigInt(5),
      full_name: 'Operator Briptu Danang',
      identifier: 'OPR-110-01',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaComplaintRepository();
    // Mock getMasterDictionaries agar tidak perlu koneksi DB fisik ke lookup tables
    vi.spyOn(PrismaComplaintRepository, 'getMasterDictionaries').mockResolvedValue({
      categories: new Map([[1, { id: 1, key: 'KAMTIBMAS', label: 'Gangguan Ketertiban' }]]),
      subcategories: new Map(),
      sources: new Map([[1, { id: 1, key: 'WARGA', label: 'Layanan Mandiri Warga' }]]),
      stations: new Map(),
      expiresAt: Date.now() + 60000,
    });
  });

  it('findById: queries prisma.complaint.findUnique and maps relations into domain ComplaintEntity', async () => {
    vi.spyOn(prisma.complaint, 'findUnique').mockResolvedValue(mockDbComplaint as any);

    const complaint = await repository.findById(BigInt(100));

    expect(prisma.complaint.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: BigInt(100) },
      })
    );
    expect(complaint).not.toBeNull();
    expect(complaint?.id).toBe(BigInt(100));
    expect(complaint?.nomorTiket).toBe('TICKET-20261030-9999');
    expect(complaint?.pelaporNama).toBe('Budi Santoso');
    expect(complaint?.status).toBe('DIPROSES');
    expect(complaint?.tahap).toBe(3);
    // Verifikasi pemetaan timeline logs
    expect(complaint?.timelines.length).toBe(2);
    expect(complaint?.timelines[1].catatan).toBe('Segera meluncur ke TKP');
    // Verifikasi assigned officer mapping
    expect(complaint?.assignedOfficerId).toBe(BigInt(88));
    expect(complaint?.assignedOfficer?.nrp).toBe('88010088');
    expect(complaint?.assignedOfficer?.rankPangkat).toBe('Aipda');
  });

  it('findByNomorTiket: supports multiple ticket prefix formats (#, stripped, TICKET-)', async () => {
    vi.spyOn(prisma.complaint, 'findFirst').mockResolvedValue(mockDbComplaint as any);

    const complaint = await repository.findByNomorTiket('20261030-9999');

    expect(prisma.complaint.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: expect.arrayContaining([
            { nomor_tiket: '20261030-9999' },
            { nomor_tiket: '#20261030-9999' },
            { nomor_tiket: 'TICKET-20261030-9999' },
          ]),
        },
      })
    );
    expect(complaint).not.toBeNull();
    expect(complaint?.nomorTiket).toBe('TICKET-20261030-9999');
  });

  it('findByPelaporHp: finds all complaints submitted by a citizen phone number ordered by created_at desc', async () => {
    vi.spyOn(prisma.complaint, 'findMany').mockResolvedValue([mockDbComplaint] as any);

    const list = await repository.findByPelaporHp('081234567890');

    expect(prisma.complaint.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { pelapor_hp: '081234567890' },
        orderBy: { created_at: 'desc' },
      })
    );
    expect(list.length).toBe(1);
    expect(list[0].pelaporHp).toBe('081234567890');
  });
});
