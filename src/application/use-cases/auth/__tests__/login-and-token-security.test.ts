import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { LoginUseCase } from '../login.use-case';
import { UserEntity } from '@/domain/entities/user.entity';
import { IUserRepository } from '@/domain/repositories/user.repository.interface';
import { generateTrackingToken, verifyTrackingToken } from '@/lib/tracking-token';

describe('Auth & Security: Login Use Case and Device Binding', () => {
  let mockPasswordHash: string;

  beforeEach(async () => {
    // Generate valid bcrypt hash for 'Polres123!'
    mockPasswordHash = await bcrypt.hash('Polres123!', 10);
  });

  const createMockUser = (props: {
    role?: string;
    isActive?: boolean;
    deviceId?: string | null;
  }): UserEntity =>
    new UserEntity({
      id: BigInt(10),
      identifier: '88012345',
      fullName: 'Aipda Joko Widodo',
      passwordHash: mockPasswordHash,
      role: props.role || 'PAWAS',
      isActive: props.isActive !== undefined ? props.isActive : true,
      officerProfile: {
        id: BigInt(100),
        rankPangkat: 'Aipda',
        jabatan: 'Pawas Sektor',
        deviceId: props.deviceId || null,
        stationName: 'Polres Pekalongan',
      },
    });

  const createMockUserRepo = (user: UserEntity | null): IUserRepository => ({
    findByIdentifier: vi.fn().mockResolvedValue(user),
    findById: vi.fn().mockResolvedValue(user),
    updateLastLogin: vi.fn().mockResolvedValue(undefined),
    updateOfficerDutyStatus: vi.fn().mockResolvedValue(undefined),
    getRawOfficerRecord: vi.fn().mockResolvedValue(null),
  });

  it('rejects login when NRP or password is empty (Zod validation)', async () => {
    const mockRepo = createMockUserRepo(null);
    const useCase = new LoginUseCase(mockRepo);

    const result = await useCase.execute({
      nrp: '',
      kataSandi: '',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('NRP');
  });

  it('rejects login when user is not found in database', async () => {
    const mockRepo = createMockUserRepo(null);
    const useCase = new LoginUseCase(mockRepo);

    const result = await useCase.execute({
      nrp: '99999999',
      kataSandi: 'Polres123!',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('tidak terdaftar');
  });

  it('rejects login when officer account is deactivated (isActive: false)', async () => {
    const inactiveUser = createMockUser({ isActive: false });
    const mockRepo = createMockUserRepo(inactiveUser);
    const useCase = new LoginUseCase(mockRepo);

    const result = await useCase.execute({
      nrp: '88012345',
      kataSandi: 'Polres123!',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Akses Ditolak');
  });

  it('rejects login when password does not match bcrypt hash', async () => {
    const user = createMockUser({ role: 'PAWAS' });
    const mockRepo = createMockUserRepo(user);
    const useCase = new LoginUseCase(mockRepo);

    const result = await useCase.execute({
      nrp: '88012345',
      kataSandi: 'SalahPassword123',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('tidak sesuai');
  });

  it('routes authenticated Pawas to /console/pawas', async () => {
    const user = createMockUser({ role: 'PAWAS' });
    const mockRepo = createMockUserRepo(user);
    const useCase = new LoginUseCase(mockRepo);

    const result = await useCase.execute({
      nrp: '88012345',
      kataSandi: 'Polres123!',
    });

    expect(result.success).toBe(true);
    expect(result.data?.targetRoute).toBe('/console');
    expect(result.data?.role).toBe('PAWAS');
    expect(mockRepo.updateLastLogin).toHaveBeenCalledWith(BigInt(10));
  });

  describe('Hardware Device ID Binding for Field Personnel (Role: PERSONIL)', () => {
    it('rejects Personil if hardware device ID is not bound in database', async () => {
      const personilNoDevice = createMockUser({ role: 'PERSONIL', deviceId: null });
      const mockRepo = createMockUserRepo(personilNoDevice);
      const useCase = new LoginUseCase(mockRepo);

      const result = await useCase.execute({
        nrp: '88012345',
        kataSandi: 'Polres123!',
        clientDeviceId: 'DEV-HP-PATROLI-01',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Akun Belum Aktif');
    });

    it('rejects Personil if client device ID does not match registered device', async () => {
      const personil = createMockUser({ role: 'PERSONIL', deviceId: 'DEV-HP-PATROLI-01' });
      const mockRepo = createMockUserRepo(personil);
      const useCase = new LoginUseCase(mockRepo);

      const result = await useCase.execute({
        nrp: '88012345',
        kataSandi: 'Polres123!',
        clientDeviceId: 'DEV-HP-LAIN-99', // Mismatched device
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Perangkat Tidak Terdaftar');
    });

    it('allows Personil login when client device ID matches registered device', async () => {
      const personil = createMockUser({ role: 'PERSONIL', deviceId: 'DEV-HP-PATROLI-01' });
      const mockRepo = createMockUserRepo(personil);
      const useCase = new LoginUseCase(mockRepo);

      const result = await useCase.execute({
        nrp: '88012345',
        kataSandi: 'Polres123!',
        clientDeviceId: 'DEV-HP-PATROLI-01',
      });

      expect(result.success).toBe(true);
      expect(result.data?.targetRoute).toBe('/console');
      expect(result.data?.role).toBe('PERSONIL');
    });
  });
});

describe('Citizen Tracking Token Security (HMAC-SHA256)', () => {
  it('generates a deterministic 16-character HMAC token for a ticket', () => {
    const token = generateTrackingToken('TICKET-1806227747');
    expect(token).toHaveLength(16);
    expect(token).toMatch(/^[0-9a-f]{16}$/);
  });

  it('verifies valid token for ticket with or without hash prefix', () => {
    const ticket = 'TICKET-1806227747';
    const token = generateTrackingToken(ticket);

    expect(verifyTrackingToken(ticket, token)).toBe(true);
    expect(verifyTrackingToken(`#${ticket}`, token)).toBe(true);
  });

  it('rejects forged token or modified ticket number (Anti-Tampering)', () => {
    const token = generateTrackingToken('TICKET-1806227747');

    // Manipulasi nomor tiket orang lain
    expect(verifyTrackingToken('TICKET-9999999999', token)).toBe(false);

    // Manipulasi token palsu
    expect(verifyTrackingToken('TICKET-1806227747', '0011223344556677')).toBe(false);
  });

  it('handles empty or malformed tokens safely without crashing', () => {
    expect(verifyTrackingToken('TICKET-1806227747', '')).toBe(false);
    expect(verifyTrackingToken('', '0123456789abcdef')).toBe(false);
  });
});
