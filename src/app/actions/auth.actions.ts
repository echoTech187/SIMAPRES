'use server';

// SIMAPRES 110 - Auth Server Actions
import { prisma } from '@/infrastructure/db/prisma.client';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { cacheGet, cacheSet, cacheInvalidate } from '@/lib/app-cache';

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
      include: {
        officer_profile: {
          include: {
            unit: true,
            station: true,
          },
        },
        station: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: `Akses Ditolak: Akun dengan NRP / ID "${trimmedNrp}" tidak terdaftar dalam pangkalan data SIMOPMAS 110!`,
      };
    }

    // 2. Verifikasi kata sandi dengan bcrypt
    let isMatch = false;
    if (user.password_hash) {
      isMatch = await bcrypt.compare(kataSandi.trim(), user.password_hash);
    }

    if (!isMatch) {
      return { success: false, error: 'Kata sandi yang Anda masukkan tidak sesuai. Silakan periksa kembali!' };
    }

    // 3. Standarisasi RBAC murni dari database (SUPERADMIN, PAWAS, PERSONIL)
    const userRole = user.role;

    // 4. Rute Navigasi Terpadu (Single Console URL SIMOPMAS 110)
    const targetRoute = '/console';

    const rankPangkat = user.officer_profile?.rank_pangkat || '';
    const satuanNama = user.officer_profile?.unit?.unit_name || user.officer_profile?.jabatan || '';
    const unitCode = user.officer_profile?.unit?.key || (user.officer_profile?.unit_id ? user.officer_profile.unit_id.toString() : '');

    // 5. Terbitkan Sesi Terenkripsi ke HTTP-Only Cookies (Keamanan Ganda & Standby Timeout 1 Jam)
    const now = Date.now();
    const sessionPayload: SessionPayload = {
      userId: user.id.toString(),
      identifier: user.identifier,
      fullName: user.full_name,
      role: userRole as any,
      rankPangkat,
      satuanNama,
      kelompokRegu: '',
      unitId: unitCode,
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
        userName: user.full_name,
        role: userRole,
        activityType: 'LOGIN',
        description: `Autentikasi berhasil: ${userRole} (${user.identifier} - ${user.full_name}) masuk ke konsol terpadu`,
        endpoint: '/console',
      });
    } catch (_) {}

    return {
      success: true,
      data: {
        userId: user.id.toString(),
        nrp: user.identifier,
        fullName: user.full_name,
        nama: user.full_name,
        pangkat: rankPangkat,
        satuanNama,
        kelompokRegu: '',
        unitId: unitCode,
        role: userRole,
        userRole: userRole,
        officer: user.officer_profile ? serializeBigInt(user.officer_profile) : null,
        registeredUnit: null,
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
  const cached = cacheGet<any>('active_officers_units');
  if (cached) {
    return { success: true, data: cached };
  }

  try {
    // Sumber tunggal (single source of truth): police_officers + users + master_operational_units
    const officers = await prisma.policeOfficer.findMany({
      include: {
        user: true,
        unit: true,
        station: true,
      },
      orderBy: { created_at: 'asc' },
    });

    const safeUnits = officers.map((off) => {
      const isAktif =
        off.duty_status === 'DINAS_PATROLI' ||
        off.duty_status === 'PIKET_SPKT' ||
        off.duty_status === 'SIAGA';
      const userRole = off.user?.role || 'PERSONIL';
      const rawFullName = off.user?.full_name || off.nrp;
      const unitCode = off.unit?.key || (off.unit_id ? off.unit_id.toString() : '');
      const unitTitle = off.unit?.unit_name || off.jabatan || '';

      return {
        id: off.id.toString(),
        nrp: off.nrp,
        nama: rawFullName,
        pangkat: off.rank_pangkat || '',
        role: userRole,
        unitId: unitCode,
        satuanNama: unitTitle,
        kelompokRegu: '',
        deviceID: off.device_id || null,
        status: isAktif ? 'Aktif' : 'Nonaktif',
        stationId: off.station_id || off.user?.station_id || null,
        stationName: off.station?.station_name || null,
        stationCode: off.station?.station_code || null,
        dutyStatus: off.duty_status || 'LEPAS_DINAS',
        assignedVehicle: off.assigned_patrol_vehicle || null,
        hasLiveGps: Boolean(off.current_gps_lat && off.current_gps_lng),
        avatarUrl: off.avatar_url || null,
        live_lat: off.current_gps_lat != null ? Number(off.current_gps_lat) : null,
        live_lng: off.current_gps_lng != null ? Number(off.current_gps_lng) : null,
        password: null,
      };
    });

    const serialized = serializeBigInt(safeUnits);
    cacheSet('active_officers_units', serialized, 30000); // 30 detik TTL
    return { success: true, data: serialized };
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
    const assignedRole = input.role || 'PERSONIL';
    let parsedStationId = input.stationId ? Number(input.stationId) : null;
    if (!parsedStationId) {
      const defaultSt = await prisma.policeStation.findFirst({
        where: { station_level: 'POLRES' },
      }).catch(() => null);
      if (defaultSt) parsedStationId = defaultSt.id;
    }
    const devId = input.deviceID && input.deviceID.trim() ? input.deviceID.trim() : null;

    // Tentukan unit operasional (master_operational_units)
    let resolvedUnitId: number | null = null;
    if (input.unitId || input.satuanNama) {
      try {
        const matchUnit = await prisma.masterOperationalUnit.findFirst({
          where: {
            OR: [
              ...(input.unitId ? [{ key: input.unitId }, { key: input.unitId.toLowerCase() }] : []),
              ...(input.satuanNama ? [{ short_name: input.satuanNama }, { unit_name: input.satuanNama }] : []),
            ],
          },
        });
        if (matchUnit) resolvedUnitId = matchUnit.id;
      } catch (_) {}
    }

    // Tentukan apakah ini operasi Edit atau Pendaftaran Baru
    let effectiveOldNrp = input.oldNrp?.trim() || null;
    if (!effectiveOldNrp && input.editId) {
      const existingOfficer = await prisma.policeOfficer.findFirst({
        where: {
          OR: [
            { nrp: input.editId },
            ...(isNaN(Number(input.editId)) ? [] : [{ id: Number(input.editId) }]),
          ],
        },
      });
      if (existingOfficer) {
        effectiveOldNrp = existingOfficer.nrp;
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

      // Cek apakah NRP baru bentrok dengan personil lain
      if (isNrpChanged) {
        const conflictUser = await prisma.user.findFirst({
          where: { identifier: input.nrp.trim(), NOT: { identifier: effectiveOldNrp } },
        });
        if (conflictUser) {
          return {
            success: false,
            error: `NRP ${input.nrp.trim()} sudah digunakan oleh personil lain!`,
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

      let updatedOfficer: any;
      if (existingOfficer) {
        updatedOfficer = await prisma.policeOfficer.update({
          where: { id: existingOfficer.id },
          data: {
            user_id: user.id,
            nrp: input.nrp.trim(),
            rank_pangkat: input.pangkat,
            jabatan: `${input.satuanNama} • ${input.kelompokRegu}`.slice(0, 95),
            unit_id: resolvedUnitId ?? existingOfficer.unit_id,
            device_id: devId,
            station_id: parsedStationId,
            ...(input.liveLat !== undefined ? { current_gps_lat: input.liveLat } : {}),
            ...(input.liveLng !== undefined ? { current_gps_lng: input.liveLng } : {}),
          },
        });
      } else {
        updatedOfficer = await prisma.policeOfficer.create({
          data: {
            user_id: user.id,
            nrp: input.nrp.trim(),
            rank_pangkat: input.pangkat,
            jabatan: `${input.satuanNama} • ${input.kelompokRegu}`.slice(0, 95),
            unit_id: resolvedUnitId,
            duty_status: 'LEPAS_DINAS',
            device_id: devId,
            station_id: parsedStationId,
            current_gps_lat: input.liveLat ?? null,
            current_gps_lng: input.liveLng ?? null,
          },
        });
      }

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
        cacheInvalidate('active_officers_units');
        cacheInvalidate('pawas_unified_data');
        revalidatePath('/console');
        revalidatePath('/console/unit');
        revalidatePath('/registrasi-unit');
        revalidatePath('/');
      } catch (_) {}

      const mappedResult = {
        id: updatedOfficer.id.toString(),
        nrp: updatedOfficer.nrp,
        nama: user.full_name,
        pangkat: updatedOfficer.rank_pangkat || '',
        role: user.role,
        unitId: input.unitId,
        satuanNama: input.satuanNama,
        kelompokRegu: input.kelompokRegu,
        deviceID: updatedOfficer.device_id || '',
        status: 'Aktif',
      };

      return { success: true, data: serializeBigInt(mappedResult) };
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
    const officer = await prisma.policeOfficer.upsert({
      where: { user_id: user.id },
      update: {
        rank_pangkat: input.pangkat,
        jabatan: `${input.satuanNama} • ${input.kelompokRegu}`.slice(0, 95),
        unit_id: resolvedUnitId,
        device_id: devId,
        station_id: parsedStationId,
      },
      create: {
        user_id: user.id,
        nrp: input.nrp.trim(),
        rank_pangkat: input.pangkat,
        jabatan: `${input.satuanNama} • ${input.kelompokRegu}`.slice(0, 95),
        unit_id: resolvedUnitId,
        duty_status: 'LEPAS_DINAS',
        assigned_patrol_vehicle: null,
        device_id: devId,
        current_gps_lat: input.liveLat ?? null,
        current_gps_lng: input.liveLng ?? null,
        station_id: parsedStationId,
      },
    });

    try {
      cacheInvalidate('active_officers_units');
      cacheInvalidate('pawas_unified_data');
      revalidatePath('/console');
    } catch (_) {}

    const mappedResult = {
      id: officer.id.toString(),
      nrp: officer.nrp,
      nama: user.full_name,
      pangkat: officer.rank_pangkat || '',
      role: user.role,
      unitId: input.unitId,
      satuanNama: input.satuanNama,
      kelompokRegu: input.kelompokRegu,
      deviceID: officer.device_id || '',
      status: 'Aktif',
    };

    return { success: true, data: serializeBigInt(mappedResult) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menyimpan data personil.' };
  }
}

export async function deleteRegisteredUnitAction(idOrNrp: string) {
  try {
    const cleanId = String(idOrNrp).trim();
    // Cari officer atau user berdasarkan id atau nrp
    const officer = await prisma.policeOfficer.findFirst({
      where: {
        OR: [
          { nrp: cleanId },
          ...(isNaN(Number(cleanId)) ? [] : [{ id: Number(cleanId) }]),
        ],
      },
      include: { user: true },
    });

    const user =
      officer?.user ||
      (await prisma.user.findFirst({
        where: {
          OR: [
            { identifier: cleanId },
            ...(isNaN(Number(cleanId)) ? [] : [{ id: BigInt(cleanId) }]),
          ],
        },
      }));

    if (!officer && !user) {
      return { success: false, error: 'Personel tidak ditemukan.' };
    }

    const nrp = officer?.nrp || user?.identifier;
    const nama = user?.full_name || officer?.nrp;
    const pangkat = officer?.rank_pangkat || '';

    // Hapus dari users jika ada (policeOfficer akan otomatis cascade karena onDelete: Cascade)
    if (user) {
      await prisma.user.delete({
        where: { id: user.id },
      });
    } else if (officer) {
      await prisma.policeOfficer.delete({
        where: { id: officer.id },
      });
    }

    try {
      cacheInvalidate('active_officers_units');
      cacheInvalidate('pawas_unified_data');
      revalidatePath('/console');
    } catch (_) {}

    return {
      success: true,
      message: `Personel ${pangkat} ${nama} (NRP: ${nrp}) berhasil dihapus.`,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menghapus personel.' };
  }
}

export async function updateDeviceTelemetryAction(input: {
  deviceId?: string;
  nrp?: string;
  lat: number;
  lng: number;
}) {
  try {
    if (input.deviceId) {
      await prisma.policeOfficer.updateMany({
        where: { device_id: input.deviceId },
        data: {
          current_gps_lat: input.lat,
          current_gps_lng: input.lng,
          last_gps_heartbeat_at: new Date(),
        },
      });
    }

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

    // revalidatePath sengaja di-skip di sini agar GPS telemetri tidak memicu reload halaman penuh di browser Next.js
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

const officerProfileCache = new Map<string, { data: any; expiresAt: number }>();
const OFFICER_PROFILE_CACHE_TTL_MS = 30 * 1000; // 30 detik

let policeOfficesCache: { data: any; expiresAt: number } | null = null;
const POLICE_OFFICES_CACHE_TTL_MS = 10 * 60 * 1000; // 10 menit

export async function getOfficerProfileByNrpAction(nrp: string) {
  try {
    const clean = nrp.trim();
    const now = Date.now();
    const cached = officerProfileCache.get(clean);
    if (cached && now < cached.expiresAt) {
      return { success: true, data: cached.data };
    }

    const user = await prisma.user.findUnique({
      where: { identifier: clean },
      include: {
        officer_profile: {
          include: {
            station: true,
            unit: true,
          },
        },
        station: true,
      },
    });

    const officerProfile =
      user?.officer_profile ||
      (await prisma.policeOfficer.findUnique({
        where: { nrp: clean },
        include: { station: true, unit: true },
      }));

    if (!user && !officerProfile) return { success: false, error: 'Data personel tidak ditemukan.' };

    const roleStr = user?.role?.toLowerCase() || 'personil';

    const kpiScore = officerProfile?.kpi_score
      ? Number(officerProfile.kpi_score)
      : 100;

    const assignedStation = officerProfile?.station || user?.station || null;

    const data = {
      id: user?.id ? user.id.toString() : officerProfile?.id ? officerProfile.id.toString() : '',
      nrp: clean,
      fullName: user?.full_name || clean,
      pangkat: officerProfile?.rank_pangkat || '',
      satuan: officerProfile?.unit?.unit_name || officerProfile?.jabatan || '',
      jabatan: officerProfile?.jabatan || '',
      unit_id: officerProfile?.unit_id || null,
      unitId: officerProfile?.unit?.key || '',
      role: roleStr,
      deviceId: officerProfile?.device_id || null,
      avatar: officerProfile?.avatar_url || null,
      kpi: kpiScore,
      stationId: assignedStation?.id || null,
      stationName: assignedStation?.station_name || null,
      stationLat: assignedStation?.office_lat ? Number(assignedStation.office_lat) : null,
      stationLng: assignedStation?.office_lng ? Number(assignedStation.office_lng) : null,
      stationRadius: assignedStation?.geofence_radius_meters ? Number(assignedStation.geofence_radius_meters) : 1000,
      currentGpsLat: officerProfile?.current_gps_lat ? Number(officerProfile.current_gps_lat) : null,
      currentGpsLng: officerProfile?.current_gps_lng ? Number(officerProfile.current_gps_lng) : null,
    };

    officerProfileCache.set(clean, { data, expiresAt: now + OFFICER_PROFILE_CACHE_TTL_MS });

    return {
      success: true,
      data,
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getPoliceOfficesAction() {
  try {
    const now = Date.now();
    if (policeOfficesCache && now < policeOfficesCache.expiresAt) {
      return { success: true, data: policeOfficesCache.data };
    }

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

    const data = rawOffices.map((o: any) => {
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
    });

    policeOfficesCache = { data, expiresAt: now + POLICE_OFFICES_CACHE_TTL_MS };

    return {
      success: true,
      data,
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

    // 3. Perbarui Session Cookie agar langsung tersinkron di seluruh konsol
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

export async function updateUserPasswordAction(newPassword: string, oldPassword?: string) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: 'Sesi dinas tidak valid atau telah berakhir. Silakan login kembali.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Kata sandi minimal 6 karakter!' };
    }
    const user = await prisma.user.findUnique({
      where: { identifier: session.identifier },
    });
    if (!user) {
      return { success: false, error: 'Data pengguna tidak ditemukan.' };
    }
    if (oldPassword) {
      const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
      if (!isMatch) {
        return { success: false, error: 'Kata sandi lama salah! Silakan periksa kembali kata sandi saat ini.' };
      }
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { identifier: session.identifier },
      data: { password_hash: hash },
    });
    try {
      await logUserActivity({
        userId: session.userId,
        identifier: session.identifier,
        userName: session.fullName,
        role: session.role,
        activityType: 'UPDATE_PASSWORD',
        description: `${session.role} (${session.identifier}) memperbarui kata sandi akun`,
        endpoint: '/console/profil',
      });
    } catch (_) {}
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengubah kata sandi.' };
  }
}
