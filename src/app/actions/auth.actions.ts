'use server';

// SIMAPRES 110 - Auth Server Actions
import { prisma } from '@/infrastructure/db/prisma.client';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

function serializeBigInt<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

import {
  setSessionCookie,
  deleteSessionCookie,
  getSession,
  touchSession,
  SessionPayload,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/session';
import { logUserActivity } from '@/lib/activity-logger';

export async function loginInternalAction(nrp: string, kataSandi: string) {
  try {
    const trimmedNrp = nrp.trim();
    if (!trimmedNrp) {
      return { success: false, error: 'Silakan masukkan NRP / ID Petugas!' };
    }

    if (!kataSandi || !kataSandi.trim()) {
      return { success: false, error: 'Silakan masukkan kata sandi Anda!' };
    }

    // 1. Cek akun pengguna di tabel users (Sumber Otoritas Utama)
    const user = await prisma.user.findUnique({
      where: { identifier: trimmedNrp },
      include: { officer_profile: true },
    });

    if (!user) {
      return {
        success: false,
        error: `Akses Ditolak: Akun dengan NRP / ID "${trimmedNrp}" tidak terdaftar dalam pangkalan data SIMAPRES 110!`,
      };
    }

    // 2. Cek profil unit jika ada
    const registeredUnit = await prisma.registeredUnit.findUnique({
      where: { nrp: trimmedNrp },
    });

    // 3. Verifikasi kata sandi dengan bcrypt
    let isMatch = false;
    if (user.password_hash) {
      isMatch = await bcrypt.compare(kataSandi.trim(), user.password_hash);
    }

    if (!isMatch) {
      return { success: false, error: 'Kata sandi yang Anda masukkan tidak sesuai. Silakan periksa kembali!' };
    }

    // 4. Standarisasi RBAC murni dari database (SUPERADMIN, PAWAS, PERSONIL)
    const userRole = user.role;

    // 5. Rute Navigasi Terpadu (Single Console URL Presisi 110)
    const targetRoute = '/console';

    // 6. Terbitkan Sesi Terenkripsi ke HTTP-Only Cookies (Keamanan Ganda & Standby Timeout 1 Jam)
    const now = Date.now();
    const sessionPayload: SessionPayload = {
      userId: user.id.toString(),
      identifier: user.identifier,
      fullName: registeredUnit?.nama || user.full_name,
      role: userRole as any,
      rankPangkat: registeredUnit?.pangkat || user.officer_profile?.rank_pangkat || '',
      satuanNama: registeredUnit?.satuanNama || user.officer_profile?.jabatan || '',
      kelompokRegu: registeredUnit?.kelompokRegu || '',
      unitId: registeredUnit?.unitId || '',
      avatar: user.officer_profile?.avatar_url || '',
      issuedAt: now,
      expiresAt: now + SESSION_MAX_AGE_SECONDS * 1000,
      lastActiveAt: now,
    };

    await setSessionCookie(sessionPayload);

    // Update waktu login terakhir di database & catat aktivitas
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { last_login_at: new Date() },
      });
      await logUserActivity({
        userId: user.id.toString(),
        identifier: user.identifier,
        userName: registeredUnit?.nama || user.full_name,
        role: userRole,
        activityType: 'LOGIN',
        description: `Autentikasi berhasil: ${userRole} (${user.identifier} - ${registeredUnit?.nama || user.full_name}) masuk ke konsol terpadu`,
        endpoint: '/console',
      });
    } catch (_) {}

    return {
      success: true,
      data: {
        userId: user.id.toString(),
        nrp: user.identifier,
        fullName: registeredUnit?.nama || user.full_name,
        nama: registeredUnit?.nama || user.full_name,
        pangkat: registeredUnit?.pangkat || user.officer_profile?.rank_pangkat || '',
        satuanNama: registeredUnit?.satuanNama || user.officer_profile?.jabatan || '',
        kelompokRegu: registeredUnit?.kelompokRegu || '',
        unitId: registeredUnit?.unitId || '',
        role: userRole,
        userRole: userRole,
        officer: user.officer_profile ? serializeBigInt(user.officer_profile) : null,
        registeredUnit: registeredUnit ? serializeBigInt(registeredUnit) : null,
        targetRoute,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Terjadi kesalahan sistem login.' };
  }
}

export async function logoutAction(reason = 'USER_MANUAL') {
  try {
    const session = await getSession();
    if (session) {
      await logUserActivity({
        userId: session.userId,
        identifier: session.identifier,
        userName: session.fullName,
        role: session.role,
        activityType: reason === 'INACTIVITY_TIMEOUT' ? 'INACTIVITY_TIMEOUT' : 'LOGOUT',
        description:
          reason === 'INACTIVITY_TIMEOUT'
            ? 'Sesi dinas ditutup otomatis oleh sistem karena waktu standby tanpa aktivitas > 1 jam'
            : 'Pengguna melakukan logout manual dan mengakhiri sesi dinas',
        endpoint: '/console',
      });
    }
    await deleteSessionCookie();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal logout.' };
  }
}

export async function getCurrentSessionAction() {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesi tidak ditemukan.' };

    try {
      const user = await prisma.user.findUnique({
        where: { identifier: session.identifier },
        include: { officer_profile: true },
      });
      if (user) {
        let userAvatar = user.officer_profile?.avatar_url || session.avatar || undefined;
        try {
          const rawUsers: any = await prisma.$queryRawUnsafe(
            `SELECT avatar_url FROM users WHERE identifier = ? LIMIT 1`,
            session.identifier
          );
          if (rawUsers && rawUsers.length > 0 && rawUsers[0].avatar_url) {
            userAvatar = rawUsers[0].avatar_url;
          }
        } catch (_) {}

        return {
          success: true,
          data: {
            ...session,
            fullName: user.full_name || session.fullName,
            email: user.email || undefined,
            phone: user.phone_number || undefined,
            avatar: userAvatar,
            rankPangkat: user.officer_profile?.rank_pangkat || session.rankPangkat,
            pangkat: user.officer_profile?.rank_pangkat || session.rankPangkat,
          },
        };
      }
    } catch (_) {}

    return { success: true, data: session };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal membaca sesi.' };
  }
}

export async function touchSessionAction() {
  try {
    const ok = await touchSession();
    return { success: ok };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getRegisteredUnitsAction() {
  try {
    // Ambil data unit aktif langsung dari database
    const units = await prisma.registeredUnit.findMany({
      orderBy: { created_at: 'asc' },
    });
    
    // Ambil data role dan station terbaru dari tabel users untuk menjamin akurasi peran & mako
    const [users, officers] = await Promise.all([
      prisma.user.findMany({
        select: {
          identifier: true,
          role: true,
          station_id: true,
          station: {
            select: { id: true, station_name: true, station_code: true, station_level: true },
          },
        },
      }),
      prisma.policeOfficer.findMany({
        select: {
          nrp: true,
          duty_status: true,
          current_gps_lat: true,
          current_gps_lng: true,
          assigned_patrol_vehicle: true,
        },
      }),
    ]);

    const roleMap = new Map<string, string>();
    const stationMap = new Map<string, any>();
    users.forEach((usr) => {
      roleMap.set(usr.identifier, usr.role);
      if (usr.station) {
        stationMap.set(usr.identifier, usr.station);
      }
    });

    const officerMap = new Map(officers.map((o) => [o.nrp, o]));

    // Jangan pernah ekspos password hash ke client
    const safeUnits = units.map((u: any) => {
      const off = officerMap.get(u.nrp);
      return {
        ...u,
        role: roleMap.get(u.nrp) || u.role || null,
        stationId: stationMap.get(u.nrp)?.id || null,
        stationName: stationMap.get(u.nrp)?.station_name || null,
        stationCode: stationMap.get(u.nrp)?.station_code || null,
        dutyStatus: off?.duty_status || 'LEPAS_DINAS',
        assignedVehicle: off?.assigned_patrol_vehicle || null,
        hasLiveGps: Boolean(off?.current_gps_lat && off?.current_gps_lng),
        password: null,
      };
    });
    return { success: true, data: serializeBigInt(safeUnits) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil data unit.' };
  }
}

export async function registerNewUnitAction(input: {
  editId?: string;
  oldNrp?: string;
  nrp: string;
  nama: string;
  pangkat: string;
  role?: string;
  unitId: string;
  satuanNama: string;
  kelompokRegu: string;
  stationId?: number | string | null;
  password?: string;
  deviceID?: string;
  liveLat?: number;
  liveLng?: number;
}) {
  try {
    const now = new Date();
    const assignedRole = input.role || 'PERSONIL';
    const parsedStationId = input.stationId ? Number(input.stationId) : null;
    const devId = input.deviceID && input.deviceID.trim() ? input.deviceID.trim() : null;

    // Tentukan apakah ini operasi Edit atau Pendaftaran Baru
    let effectiveOldNrp = input.oldNrp?.trim() || null;
    if (!effectiveOldNrp && input.editId) {
      const existingReg = await prisma.registeredUnit.findUnique({
        where: { id: input.editId },
      });
      if (existingReg) {
        effectiveOldNrp = existingReg.nrp;
      }
    }

    const isEditMode = Boolean(effectiveOldNrp || input.editId);

    // Persiapkan kata sandi (jika edit dan kosong, jangan timpa sandi lama)
    let hashedPassword: string | null = null;
    if (input.password && input.password.trim()) {
      hashedPassword = await bcrypt.hash(input.password.trim(), 10);
    } else if (!isEditMode) {
      hashedPassword = await bcrypt.hash('polripresisi2026', 10);
    }

    if (isEditMode && effectiveOldNrp) {
      // === MODE EDIT: PERBARUI RECORD YANG SUDAH ADA ===
      const isNrpChanged = effectiveOldNrp !== input.nrp.trim();

      // Cek apakah NRP baru bentrok dengan user/unit lain
      if (isNrpChanged) {
        const conflictUser = await prisma.user.findFirst({
          where: { identifier: input.nrp.trim(), NOT: { identifier: effectiveOldNrp } },
        });
        const conflictReg = await prisma.registeredUnit.findFirst({
          where: { nrp: input.nrp.trim(), NOT: { nrp: effectiveOldNrp } },
        });
        if (conflictUser || conflictReg) {
          return {
            success: false,
            error: `NRP ${input.nrp.trim()} sudah digunakan oleh personil/satuan lain!`,
          };
        }
      }

      // 1. Update Tabel users
      let user = await prisma.user.findUnique({
        where: { identifier: effectiveOldNrp },
      });

      if (user) {
        const userUpdateData: any = {
          identifier: input.nrp.trim(),
          full_name: input.nama.trim(),
          role: assignedRole,
          station_id: parsedStationId,
        };
        if (hashedPassword) {
          userUpdateData.password_hash = hashedPassword;
        }
        user = await prisma.user.update({
          where: { id: user.id },
          data: userUpdateData,
        });
      } else {
        const fallbackPass = hashedPassword || (await bcrypt.hash('polripresisi2026', 10));
        user = await prisma.user.create({
          data: {
            identifier: input.nrp.trim(),
            password_hash: fallbackPass,
            full_name: input.nama.trim(),
            phone_number: '',
            role: assignedRole,
            station_id: parsedStationId,
          },
        });
      }

      // 2. Update Tabel police_officers
      const existingOfficer = await prisma.policeOfficer.findFirst({
        where: {
          OR: [{ user_id: user.id }, { nrp: effectiveOldNrp }],
        },
      });

      if (existingOfficer) {
        await prisma.policeOfficer.update({
          where: { id: existingOfficer.id },
          data: {
            user_id: user.id,
            nrp: input.nrp.trim(),
            rank_pangkat: input.pangkat,
            jabatan: `${input.satuanNama} • ${input.kelompokRegu}`.slice(0, 95),
            device_id: devId,
            station_id: parsedStationId,
            ...(input.liveLat !== undefined ? { current_gps_lat: input.liveLat } : {}),
            ...(input.liveLng !== undefined ? { current_gps_lng: input.liveLng } : {}),
          },
        });
      } else {
        await prisma.policeOfficer.create({
          data: {
            user_id: user.id,
            nrp: input.nrp.trim(),
            rank_pangkat: input.pangkat,
            jabatan: `${input.satuanNama} • ${input.kelompokRegu}`.slice(0, 95),
            duty_status: 'LEPAS_DINAS',
            device_id: devId,
            station_id: parsedStationId,
            current_gps_lat: input.liveLat ?? null,
            current_gps_lng: input.liveLng ?? null,
          },
        });
      }

      // 3. Update Tabel registered_units
      const regUnit = await prisma.registeredUnit.findFirst({
        where: input.editId ? { id: input.editId } : { nrp: effectiveOldNrp },
      });

      let updatedReg: any;
      if (regUnit) {
        const regUpdateData: any = {
          nrp: input.nrp.trim(),
          nama: input.nama.trim(),
          pangkat: input.pangkat,
          role: assignedRole,
          unitId: input.unitId,
          satuanNama: input.satuanNama,
          kelompokRegu: input.kelompokRegu,
          deviceID: devId || '',
          tanggalUpdate: now,
        };
        if (hashedPassword) {
          regUpdateData.password = hashedPassword;
        }
        if (input.liveLat !== undefined) regUpdateData.live_lat = input.liveLat;
        if (input.liveLng !== undefined) regUpdateData.live_lng = input.liveLng;

        updatedReg = await prisma.registeredUnit.update({
          where: { id: regUnit.id },
          data: regUpdateData,
        });
      } else {
        const fallbackPass = hashedPassword || (await bcrypt.hash('polripresisi2026', 10));
        updatedReg = await prisma.registeredUnit.create({
          data: {
            id: input.editId || `REG-UNIT-${input.nrp.trim()}`,
            nrp: input.nrp.trim(),
            nama: input.nama.trim(),
            pangkat: input.pangkat,
            role: assignedRole,
            unitId: input.unitId,
            satuanNama: input.satuanNama,
            kelompokRegu: input.kelompokRegu,
            password: fallbackPass,
            deviceID: devId || '',
            live_lat: input.liveLat ?? null,
            live_lng: input.liveLng ?? null,
            status: 'Aktif',
            tanggalDaftar: now,
            tanggalUpdate: now,
          },
        });
      }

      // Sinkronkan kolom role via query langsung untuk menjamin konsistensi
      await prisma.$executeRawUnsafe(
        'UPDATE registered_units SET role = ? WHERE nrp = ?',
        assignedRole,
        input.nrp.trim()
      );

      // Jika NRP berubah, sinkronkan relasi eksternal
      if (isNrpChanged) {
        try {
          await prisma.$executeRawUnsafe(
            'UPDATE patrol_fleet_units SET driver_officer_nrp = ? WHERE driver_officer_nrp = ?',
            input.nrp.trim(),
            effectiveOldNrp
          );
          await prisma.$executeRawUnsafe(
            'UPDATE device_pairing_sessions SET nrp = ? WHERE nrp = ?',
            input.nrp.trim(),
            effectiveOldNrp
          );
        } catch (_) {}
      }

      try {
        revalidatePath('/console');
        revalidatePath('/console/unit');
        revalidatePath('/registrasi-unit');
        revalidatePath('/');
      } catch (_) {}

      return { success: true, data: serializeBigInt({ ...updatedReg, role: assignedRole }) };
    }

    // === MODE PENDAFTARAN BARU ===
    const passHash = hashedPassword || (await bcrypt.hash('polripresisi2026', 10));

    // 1. Sinkronisasi Akun User (Credentials & Role di Tabel users)
    const user = await prisma.user.upsert({
      where: { identifier: input.nrp.trim() },
      update: {
        full_name: input.nama.trim(),
        role: assignedRole,
        password_hash: passHash,
        station_id: parsedStationId,
      },
      create: {
        identifier: input.nrp.trim(),
        password_hash: passHash,
        full_name: input.nama.trim(),
        phone_number: '',
        role: assignedRole || '',
        station_id: parsedStationId,
      },
    });

    // 2. Sinkronisasi Profil Personil Polisi (Tabel police_officers)
    await prisma.policeOfficer.upsert({
      where: { user_id: user.id },
      update: {
        rank_pangkat: input.pangkat,
        jabatan: `${input.satuanNama} • ${input.kelompokRegu}`.slice(0, 95),
        device_id: devId,
        station_id: parsedStationId,
      },
      create: {
        user_id: user.id,
        nrp: input.nrp.trim(),
        rank_pangkat: input.pangkat,
        jabatan: `${input.satuanNama} • ${input.kelompokRegu}`.slice(0, 95),
        duty_status: 'LEPAS_DINAS',
        assigned_patrol_vehicle: null,
        device_id: devId,
        current_gps_lat: input.liveLat ?? null,
        current_gps_lng: input.liveLng ?? null,
        station_id: parsedStationId,
      },
    });

    // 3. Sinkronisasi Data Unit Satuan Operasional (Tabel registered_units dengan password ter-enkripsi)
    const reg = await prisma.registeredUnit.upsert({
      where: { nrp: input.nrp.trim() },
      update: {
        nama: input.nama.trim(),
        pangkat: input.pangkat,
        unitId: input.unitId,
        satuanNama: input.satuanNama,
        kelompokRegu: input.kelompokRegu,
        password: passHash,
        deviceID: devId || '',
        live_lat: input.liveLat ?? null,
        live_lng: input.liveLng ?? null,
        tanggalUpdate: now,
      },
      create: {
        id: `REG-UNIT-${input.nrp.trim()}`,
        nrp: input.nrp.trim(),
        nama: input.nama.trim(),
        pangkat: input.pangkat,
        unitId: input.unitId,
        satuanNama: input.satuanNama,
        kelompokRegu: input.kelompokRegu,
        password: passHash,
        deviceID: devId || '',
        live_lat: input.liveLat ?? null,
        live_lng: input.liveLng ?? null,
        status: 'Aktif',
        tanggalDaftar: now,
        tanggalUpdate: now,
      },
    });

    // Sinkronkan kolom role di registered_units via raw query untuk memastikan konsistensi
    await prisma.$executeRawUnsafe(
      'UPDATE registered_units SET role = ? WHERE nrp = ?',
      assignedRole,
      input.nrp.trim()
    );

    try {
      revalidatePath('/console');
      revalidatePath('/console/unit');
      revalidatePath('/registrasi-unit');
      revalidatePath('/');
    } catch (_) {}
    return { success: true, data: serializeBigInt({ ...reg, role: assignedRole }) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menyimpan data satuan unit.' };
  }
}

export async function deleteRegisteredUnitAction(idOrNrp: string) {
  try {
    const reg = await prisma.registeredUnit.findFirst({
      where: {
        OR: [{ id: idOrNrp }, { nrp: idOrNrp }],
      },
    });

    if (!reg) {
      return { success: false, error: 'Unit tidak ditemukan.' };
    }

    const nrp = reg.nrp;

    // Hapus dari registered_units
    await prisma.registeredUnit.delete({
      where: { id: reg.id },
    });

    // Hapus dari users jika ada (officer_profile akan otomatis ter-cascade)
    const user = await prisma.user.findUnique({
      where: { identifier: nrp },
    });

    if (user) {
      await prisma.user.delete({
        where: { id: user.id },
      });
    } else {
      await prisma.policeOfficer.deleteMany({
        where: { nrp },
      });
    }

    try {
      revalidatePath('/console');
      revalidatePath('/console/unit');
      revalidatePath('/registrasi-unit');
      revalidatePath('/');
    } catch (_) {}

    return {
      success: true,
      message: `Unit ${reg.pangkat} ${reg.nama} (NRP: ${nrp}) berhasil dihapus.`,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menghapus unit.' };
  }
}

export async function updateDeviceTelemetryAction(input: {
  deviceId?: string;
  nrp?: string;
  lat: number;
  lng: number;
}) {
  try {
    // Update live location di registered_units jika ada deviceId
    if (input.deviceId) {
      await (prisma as any).registeredUnit?.updateMany({
        where: { deviceID: input.deviceId },
        data: {
          live_lat: input.lat,
          live_lng: input.lng,
          tanggalUpdate: new Date(),
        },
      });
    }

    // Update di police_officers jika cocok
    if (input.nrp) {
      await prisma.policeOfficer.updateMany({
        where: { nrp: input.nrp },
        data: {
          current_gps_lat: input.lat,
          current_gps_lng: input.lng,
          last_gps_heartbeat_at: new Date(),
        },
      });
    }

    revalidatePath('/personil');
    revalidatePath('/command-center');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getMasterDropdownsAction() {
  try {
    const [units, ranks, roles, stations] = await Promise.all([
      prisma.masterOperationalUnit.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }),
      prisma.masterRank.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }),
      prisma.masterRole.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      }),
      prisma.policeStation.findMany({
        orderBy: { id: 'asc' },
      }),
    ]);

    const items = [
      ...ranks.map((r: any) => ({
        id: `pangkat-${r.id}`,
        tipe: 'pangkat',
        code: r.key,
        label: r.label,
        urutan: r.display_order,
      })),
      ...units.map((u: any) => ({
        id: `satuan-${u.id}`,
        tipe: 'satuan',
        code: u.key,
        label: u.unit_name,
        urutan: u.display_order,
      })),
      ...roles.map((ro: any) => ({
        id: `role-${ro.id}`,
        tipe: 'role',
        code: ro.key,
        label: ro.label,
        urutan: ro.display_order,
      })),
      ...stations.map((st: any) => ({
        id: `station-${st.id}`,
        numericId: st.id,
        tipe: 'station',
        code: st.station_code,
        label: `${st.station_name} (${st.station_level})`,
        name: st.station_name,
        level: st.station_level,
      })),
    ];
    return { success: true, data: items };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getOfficerProfileByNrpAction(nrp: string) {
  try {
    const clean = nrp.trim();
    const reg = await prisma.registeredUnit.findUnique({
      where: { nrp: clean },
    });
    const user = await prisma.user.findUnique({
      where: { identifier: clean },
      include: { officer_profile: true },
    });
    if (!reg && !user) return { success: false, error: 'Data personel tidak ditemukan.' };

    const roleStr = user?.role?.toLowerCase();

    const officerProfile =
      user?.officer_profile ||
      (await prisma.policeOfficer.findUnique({
        where: { nrp: clean },
      }));

    const kpiScore = officerProfile?.kpi_score
      ? Number(officerProfile.kpi_score)
      : 100;

    let resolvedUnitId = officerProfile?.unit_id || null;
    if (!resolvedUnitId && (reg?.unitId || reg?.satuanNama)) {
      try {
        const matchUnit = await prisma.masterOperationalUnit.findFirst({
          where: {
            OR: [
              ...(reg?.unitId ? [{ key: reg.unitId }, { key: reg.unitId.toLowerCase() }] : []),
              ...(reg?.satuanNama ? [{ short_name: reg.satuanNama }, { unit_name: reg.satuanNama }] : []),
            ],
          },
        });
        if (matchUnit) {
          resolvedUnitId = matchUnit.id;
          if (officerProfile && !officerProfile.unit_id) {
            await prisma.policeOfficer.update({
              where: { id: officerProfile.id },
              data: { unit_id: matchUnit.id },
            });
          }
        }
      } catch (_) {}
    }

    return {
      success: true,
      data: {
        id: user?.id ? user.id.toString() : officerProfile?.id ? officerProfile.id.toString() : '',
        nrp: clean,
        fullName: reg?.nama || user?.full_name || '',
        pangkat: reg?.pangkat || officerProfile?.rank_pangkat || '',
        satuan: reg?.satuanNama || officerProfile?.jabatan || '',
        jabatan: reg?.kelompokRegu || '',
        unit_id: resolvedUnitId,
        unitId: reg?.unitId || '',
        role: roleStr,
        deviceId: (reg as any)?.deviceID || (officerProfile as any)?.device_id || null,
        avatar: user?.officer_profile?.avatar_url || null,
        kpi: kpiScore,
      },
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getPoliceOfficesAction() {
  try {
    const rawOffices = await prisma.policeStation.findMany({
      orderBy: { id: 'asc' },
      include: {
        users: {
          select: {
            full_name: true,
            role: true,
          },
          take: 5,
        },
      },
    });

    return {
      success: true,
      data: rawOffices.map((o: any) => {
        const userNames = (o.users || []).map((u: any) => u.full_name).filter(Boolean);
        const petugasStr = userNames.length > 0 ? userNames.join(', ') : '-';
        const levelLabel = o.station_level;

        return {
          id: o.id,
          code: o.station_code,
          name: o.station_name,
          type: o.station_level,
          address: o.address,
          lat: Number(o.office_lat),
          lng: Number(o.office_lng),
          radius: Number(o.geofence_radius_meters || 500),
          petugas: petugasStr,
          status: levelLabel,
          statusColor: '#1E3A8A',
          tugas: o.station_name,
          telemetri: o.geofence_radius_meters,
        };
      }),
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil data kantor kepolisian.' };
  }
}

export async function updateUserProfileAndAvatarAction(input: {
  fullName: string;
  pangkat?: string;
  phoneNumber?: string;
  email?: string;
  avatar?: string | null;
}) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: 'Sesi dinas tidak valid atau telah berakhir. Silakan login kembali.' };
    }

    const trimmedName = input.fullName.trim();
    if (!trimmedName) {
      return { success: false, error: 'Nama lengkap tidak boleh kosong!' };
    }

    const identifier = session.identifier;

    // 1. Update data akun User
    await prisma.user.update({
      where: { identifier },
      data: {
        full_name: trimmedName,
        phone_number: input.phoneNumber ? input.phoneNumber.trim() : undefined,
        email: input.email ? input.email.trim() : undefined,
      },
    });

    if (input.avatar !== undefined) {
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE users SET avatar_url = ? WHERE identifier = ?`,
          input.avatar || null,
          identifier
        );
      } catch (err) {
        console.warn('Could not update avatar_url on users:', err);
      }
    }

    // 2. Update data profil Petugas / PoliceOfficer
    try {
      await prisma.policeOfficer.updateMany({
        where: { nrp: identifier },
        data: {
          rank_pangkat: input.pangkat ? input.pangkat.trim() : undefined,
          avatar_url: input.avatar !== undefined ? (input.avatar || null) : undefined,
        },
      });
    } catch (_) {}

    // 3. Update data Unit Terdaftar jika ada
    try {
      await prisma.registeredUnit.updateMany({
        where: { nrp: identifier },
        data: {
          nama: trimmedName,
          pangkat: input.pangkat ? input.pangkat.trim() : undefined,
          tanggalUpdate: new Date(),
        },
      });

      if (input.avatar !== undefined) {
        await prisma.$executeRawUnsafe(
          `UPDATE registered_units SET avatar_url = ? WHERE nrp = ?`,
          input.avatar || null,
          identifier
        );
      }
    } catch (_) {}

    // 4. Perbarui Session Cookie agar langsung tersinkron di seluruh konsol
    const updatedSession: SessionPayload = {
      ...session,
      fullName: trimmedName,
      rankPangkat: input.pangkat || session.rankPangkat,
      avatar: input.avatar !== undefined ? (input.avatar || '') : session.avatar,
      lastActiveAt: Date.now(),
    };
    await setSessionCookie(updatedSession);

    // 5. Catat log aktivitas audit
    try {
      await logUserActivity({
        userId: session.userId,
        identifier: session.identifier,
        userName: trimmedName,
        role: session.role,
        activityType: 'UPDATE_PROFILE',
        description: `${session.role} (${session.identifier}) memperbarui data profil & foto dinas`,
        endpoint: '/console/profil',
      });
    } catch (_) {}

    try {
      revalidatePath('/console');
      revalidatePath('/console/profil');
    } catch (_) {}

    return {
      success: true,
      data: {
        fullName: trimmedName,
        pangkat: input.pangkat || session.rankPangkat,
        avatar: input.avatar !== undefined ? input.avatar : session.avatar,
        phone: input.phoneNumber,
        email: input.email,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal memperbarui profil.' };
  }
}
