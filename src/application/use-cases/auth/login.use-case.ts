/**
 * SIMAPRES 110 - APPLICATION USE CASE: LOGIN
 * Lapisan: Application (Orkestrator Alur Bisnis Autentikasi Kedinasan)
 */

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { IUserRepository } from '@/domain/repositories/user.repository.interface';

export const LoginInputSchema = z.object({
  nrp: z.string().trim().min(1, 'Silakan masukkan NRP / ID Petugas!'),
  kataSandi: z.string().trim().min(1, 'Silakan masukkan kata sandi Anda!'),
  clientDeviceId: z.string().optional(),
});

export type LoginInputDto = z.infer<typeof LoginInputSchema>;

export interface LoginResultDto {
  success: boolean;
  error?: string;
  data?: {
    userId: string;
    nrp: string;
    fullName: string;
    nama: string;
    pangkat: string;
    satuanNama: string;
    kelompokRegu: string;
    unitId: string;
    role: string;
    userRole: string;
    targetRoute: string;
    avatarUrl?: string | null;
    stationId?: string;
    stationName?: string;
    stationCode?: string;
    rawOfficer?: any;
    deviceId?: string | null;
  };
}

export class LoginUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: LoginInputDto): Promise<LoginResultDto> {
    // 1. Validasi input dengan Zod
    const validation = LoginInputSchema.safeParse(input);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Input autentikasi tidak valid!';
      return { success: false, error: firstError };
    }

    const { nrp: cleanNrp, kataSandi: cleanPassword, clientDeviceId } = validation.data;

    // 2. Cari akun pengguna di pangkalan data melalui Repository
    const user = await this.userRepository.findByIdentifier(cleanNrp);
    if (!user || !user.canAuthenticate()) {
      return {
        success: false,
        error: `Akses Ditolak: Akun dengan NRP / ID "${cleanNrp}" tidak terdaftar dalam pangkalan data SIMOPMAS 110!`,
      };
    }

    // 3. Verifikasi kata sandi dengan bcrypt
    let isMatch = false;
    if (user.passwordHash) {
      isMatch = await bcrypt.compare(cleanPassword, user.passwordHash);
    }

    if (!isMatch) {
      return {
        success: false,
        error: 'Kata sandi yang Anda masukkan tidak sesuai. Silakan periksa kembali!',
      };
    }

    // 4. Ambil raw officer record untuk kompatibilitas data sesi & verifikasi device
    let rawOfficer: any = null;
    if (user.id) {
      try {
        rawOfficer = await this.userRepository.getRawOfficerRecord(user.id);
      } catch (_e) {
        rawOfficer = null;
      }
    }

    // 5. Validasi Device ID Khusus Personel Lapangan (Role: PERSONIL)
    if (user.role === 'PERSONIL') {
      const registeredDeviceId = (user.officerProfile?.deviceId || rawOfficer?.device_id || '').trim();

      // Kasus A: Belum mendaftarkan Device ID di database
      if (!registeredDeviceId) {
        return {
          success: false,
          error:
            'Akun Belum Aktif: Akun Anda belum menautkan Device ID (perangkat patroli). Silakan lakukan scan Device ID atau segera hubungi Administrator untuk aktivasi perangkat dinas Anda.',
        };
      }

      // Kasus B: Device yang digunakan saat ini tidak cocok dengan yang terdaftar
      const cleanClientDeviceId = (clientDeviceId || '').trim().toUpperCase();
      const cleanRegisteredDeviceId = registeredDeviceId.toUpperCase();

      if (!cleanClientDeviceId || cleanClientDeviceId !== cleanRegisteredDeviceId) {
        return {
          success: false,
          error: `Perangkat Tidak Terdaftar: Perangkat yang Anda gunakan [${
            cleanClientDeviceId || 'Tidak Terdeteksi'
          }] bukan perangkat dinas yang terdaftar untuk akun ini [${cleanRegisteredDeviceId}]. Silakan gunakan perangkat patroli yang terdaftar atau hubungi Administrator.`,
        };
      }
    }

    // 6. Update waktu login terakhir (hanya setelah seluruh validasi lulus)
    if (user.id) {
      try {
        await this.userRepository.updateLastLogin(user.id);
      } catch (_e) {
        // Non-blocking update
      }
    }

    // 7. Jika role adalah PERSONIL, otomatis aktifkan status kedinasan (DINAS_PATROLI)
    if (user.role === 'PERSONIL' && user.id) {
      try {
        await this.userRepository.updateOfficerDutyStatus(user.id, 'DINAS_PATROLI');
      } catch (_e) {
        // Non-blocking update
      }
    }

    const profile = user.officerProfile;
    const rankPangkat = profile?.rankPangkat || '';
    const satuanNama = profile?.unitName || profile?.jabatan || '';
    const unitCode = profile?.unitKey || (profile?.unitId ? profile.unitId.toString() : '');
    const stationId = profile?.stationId ? profile.stationId.toString() : '';
    const stationName = profile?.stationName || '';
    const stationCode = profile?.stationCode || '';
    const avatarUrl = profile?.avatarUrl || null;
    const officerDeviceId = rawOfficer?.device_id || profile?.deviceId || null;

    return {
      success: true,
      data: {
        userId: user.id ? user.id.toString() : '',
        nrp: user.identifier,
        fullName: user.fullName,
        nama: user.fullName,
        pangkat: rankPangkat,
        satuanNama,
        kelompokRegu: '',
        unitId: unitCode,
        role: user.role,
        userRole: user.role,
        targetRoute: '/console',
        avatarUrl,
        stationId,
        stationName,
        stationCode,
        rawOfficer,
        deviceId: officerDeviceId,
      },
    };
  }
}
