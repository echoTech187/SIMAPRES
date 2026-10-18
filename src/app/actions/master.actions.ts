'use server';

// SIMAPRES 110 - Master Data CRUD Server Actions
import { prisma } from '@/infrastructure/db/prisma.client';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session';
import { logUserActivity } from '@/lib/activity-logger';

function serializeBigInt<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

async function auditLog(activityType: string, description: string) {
  try {
    const session = await getSession();
    if (session) {
      await logUserActivity({
        userId: session.userId,
        identifier: session.identifier,
        userName: session.fullName,
        role: session.role,
        activityType,
        description,
        endpoint: '/console',
      });
    }
  } catch (_) {}
}

// ==============================================================================
// 1. RINGKASAN MASTER DATA UNTUK TAB COUNTERS
// ==============================================================================
export async function getMasterCountersAction() {
  try {
    const [ranks, units, roles, stations, categories, hotspots, hotspotCategories, vehicles, dutyStatuses] =
      await Promise.all([
        prisma.masterRank.count(),
        prisma.masterOperationalUnit.count(),
        prisma.masterRole.count(),
        prisma.policeStation.count(),
        prisma.masterIncidentCategory.count(),
        prisma.hotspotLocation.count(),
        prisma.masterHotspotCategory.count(),
        prisma.patrolVehicle.count(),
        prisma.masterDutyStatus.count(),
      ]);

    return {
      success: true,
      data: {
        ranks,
        units,
        roles,
        stations,
        categories,
        hotspots,
        hotspotCategories,
        vehicles,
        dutyStatuses,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 2. MASTER PANGKAT KEPOLISIAN (master_ranks)
// ==============================================================================
export async function getMasterRanksAction() {
  try {
    let rows = await prisma.masterRank.findMany({
      orderBy: { display_order: 'asc' },
    });

    // Auto-seed default jika tabel masih kosong
    if (rows.length === 0) {
      const defaultRanks = [
        { key: 'BRIPDA', label: 'Bripda (Brigadir Polisi Dua)', display_order: 1 },
        { key: 'BRIPTU', label: 'Briptu (Brigadir Polisi Satu)', display_order: 2 },
        { key: 'BRIGADIR', label: 'Brigadir (Brigadir Polisi)', display_order: 3 },
        { key: 'BRIPKA', label: 'Bripka (Brigadir Polisi Kepala)', display_order: 4 },
        { key: 'AIPDA', label: 'Aipda (Ajun Inspektur Polisi Dua)', display_order: 5 },
        { key: 'AIPTU', label: 'Aiptu (Ajun Inspektur Polisi Satu)', display_order: 6 },
        { key: 'IPDA', label: 'Ipda (Inspektur Polisi Dua)', display_order: 7 },
        { key: 'IPTU', label: 'Iptu (Inspektur Polisi Satu)', display_order: 8 },
        { key: 'AKP', label: 'AKP (Ajun Komisaris Polisi)', display_order: 9 },
        { key: 'KOMPOL', label: 'Kompol (Komisaris Polisi)', display_order: 10 },
        { key: 'AKBP', label: 'AKBP (Ajun Komisaris Besar Polisi)', display_order: 11 },
        { key: 'KOMBES', label: 'Kombes Pol (Komisaris Besar Polisi)', display_order: 12 },
      ];
      for (const r of defaultRanks) {
        await prisma.masterRank.create({ data: { ...r, is_active: true } });
      }
      rows = await prisma.masterRank.findMany({ orderBy: { display_order: 'asc' } });
    }

    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMasterRankAction(data: {
  key: string;
  label: string;
  display_order: number;
  is_active: boolean;
}) {
  try {
    const cleanKey = data.key.trim().toUpperCase();
    if (!cleanKey || !data.label.trim()) {
      return { success: false, error: 'Kode pangkat dan Label wajib diisi!' };
    }

    const created = await prisma.masterRank.create({
      data: {
        key: cleanKey,
        label: data.label.trim(),
        display_order: Number(data.display_order) || 1,
        is_active: Boolean(data.is_active),
      },
    });

    await auditLog('CREATE_MASTER_RANK', `Menambahkan master pangkat baru: ${created.key} - ${created.label}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(created) };
  } catch (error: any) {
    return { success: false, error: error.message?.includes('Unique') ? 'Kode pangkat sudah terdaftar!' : error.message };
  }
}

export async function updateMasterRankAction(
  id: number,
  data: { key: string; label: string; display_order: number; is_active: boolean }
) {
  try {
    const updated = await prisma.masterRank.update({
      where: { id: Number(id) },
      data: {
        key: data.key.trim().toUpperCase(),
        label: data.label.trim(),
        display_order: Number(data.display_order) || 1,
        is_active: Boolean(data.is_active),
      },
    });

    await auditLog('UPDATE_MASTER_RANK', `Memperbarui master pangkat ID ${id}: ${updated.key} - ${updated.label}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMasterRankAction(id: number) {
  try {
    const deleted = await prisma.masterRank.delete({
      where: { id: Number(id) },
    });
    await auditLog('DELETE_MASTER_RANK', `Menghapus master pangkat ID ${id}: ${deleted.key} - ${deleted.label}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 3. MASTER SATUAN UNIT OPERASIONAL (master_operational_units)
// ==============================================================================
export async function getMasterOperationalUnitsAction() {
  try {
    let rows = await prisma.masterOperationalUnit.findMany({
      orderBy: { display_order: 'asc' },
    });

    if (rows.length === 0) {
      const defaults = [
        {
          key: 'sabhara',
          unit_name: 'Satuan Samapta Presisi',
          short_name: 'Sat Samapta',
          icon_emoji: '🚔',
          duties: 'Patroli perintis presisi, penanganan pertama TKP, penguraian massa dan sterilisasi kamtibmas.',
          default_orders: 'Meluncur ke TKP dengan lampu rotator biru, amankan perimeter dan koordinasi dengan posko.',
          display_order: 1,
        },
        {
          key: 'lantas',
          unit_name: 'Satuan Lalu Lintas (Satlantas)',
          short_name: 'Sat Lantas',
          icon_emoji: '🚓',
          duties: 'Pengaturan, penjagaan, pengawalan, patroli jalan raya serta penanganan kecelakaan lalu lintas.',
          default_orders: 'Prioritaskan keselamatan korban laka, rekayasa arus jalan dan amankan bukti ranmor.',
          display_order: 2,
        },
        {
          key: 'reskrim',
          unit_name: 'Satuan Reserse Kriminal (Sat Reskrim)',
          short_name: 'Sat Reskrim',
          icon_emoji: '🕵️‍♂️',
          duties: 'Penyelidikan, penyidikan, identifikasi Inafis, olah TKP tindak pidana dan penindakan kejahatan.',
          default_orders: 'Pasang garis polisi (police line), amankan rekaman CCTV dan kumpulkan saksi kunci.',
          display_order: 3,
        },
        {
          key: 'binmas',
          unit_name: 'Satuan Pembinaan Masyarakat (Sat Binmas)',
          short_name: 'Sat Binmas',
          icon_emoji: '🤝',
          duties: 'Sambang kemasyarakatan, problem solving mediasi warga, pembinaan poskamling dan penyuluhan hukum.',
          default_orders: 'Lakukan mediasi damai humanis, libatkan tokoh masyarakat RT/RW dan redam eskalasi konflik.',
          display_order: 4,
        },
        {
          key: 'intel',
          unit_name: 'Satuan Intelijen Keamanan (Sat Intelkam)',
          short_name: 'Sat Intelkam',
          icon_emoji: '👁️',
          duties: 'Deteksi dini potensi kerawanan, pemetaan konflik sosial politik dan penggalangan kamtibmas tertutup.',
          default_orders: 'Lakukan pulbaket tertutup, petakan aktor penggerak dan laporkan perkembangan situasional ke Pawas.',
          display_order: 5,
        },
      ];
      for (const u of defaults) {
        await prisma.masterOperationalUnit.create({ data: { ...u, is_active: true } });
      }
      rows = await prisma.masterOperationalUnit.findMany({ orderBy: { display_order: 'asc' } });
    }

    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMasterOperationalUnitAction(data: {
  key: string;
  unit_name: string;
  short_name: string;
  icon_emoji?: string;
  duties: string;
  default_orders: string;
  display_order: number;
  is_active: boolean;
}) {
  try {
    const cleanKey = data.key.trim().toLowerCase();
    if (!cleanKey || !data.unit_name.trim()) {
      return { success: false, error: 'Kode unit dan Nama Satuan wajib diisi!' };
    }

    const created = await prisma.masterOperationalUnit.create({
      data: {
        key: cleanKey,
        unit_name: data.unit_name.trim(),
        short_name: data.short_name.trim() || data.unit_name.trim(),
        icon_emoji: data.icon_emoji?.trim() || '🚔',
        duties: data.duties.trim() || '-',
        default_orders: data.default_orders.trim() || '-',
        display_order: Number(data.display_order) || 1,
        is_active: Boolean(data.is_active),
      },
    });

    await auditLog('CREATE_MASTER_UNIT', `Menambahkan master unit operasional: ${created.key} - ${created.unit_name}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(created) };
  } catch (error: any) {
    return { success: false, error: error.message?.includes('Unique') ? 'Kode unit sudah terdaftar!' : error.message };
  }
}

export async function updateMasterOperationalUnitAction(
  id: number,
  data: {
    key: string;
    unit_name: string;
    short_name: string;
    icon_emoji?: string;
    duties: string;
    default_orders: string;
    display_order: number;
    is_active: boolean;
  }
) {
  try {
    const updated = await prisma.masterOperationalUnit.update({
      where: { id: Number(id) },
      data: {
        key: data.key.trim().toLowerCase(),
        unit_name: data.unit_name.trim(),
        short_name: data.short_name.trim() || data.unit_name.trim(),
        icon_emoji: data.icon_emoji?.trim() || '🚔',
        duties: data.duties.trim() || '-',
        default_orders: data.default_orders.trim() || '-',
        display_order: Number(data.display_order) || 1,
        is_active: Boolean(data.is_active),
      },
    });

    await auditLog('UPDATE_MASTER_UNIT', `Memperbarui master unit ID ${id}: ${updated.key} - ${updated.unit_name}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMasterOperationalUnitAction(id: number) {
  try {
    const deleted = await prisma.masterOperationalUnit.delete({
      where: { id: Number(id) },
    });
    await auditLog('DELETE_MASTER_UNIT', `Menghapus master unit ID ${id}: ${deleted.key} - ${deleted.unit_name}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 4. MASTER ROLE / HAK AKSES SISTEM (master_roles)
// ==============================================================================
export async function getMasterRolesAction() {
  try {
    let rows = await prisma.masterRole.findMany({
      orderBy: { display_order: 'asc' },
    });

    if (rows.length === 0) {
      const defaultRoles = [
        {
          key: 'SUPERADMIN',
          label: 'Super Administrator Presisi',
          description: 'Akses penuh administrasi master data, registrasi unit, manajemen hak akses & audit sistem.',
          display_order: 1,
        },
        {
          key: 'PAWAS',
          label: 'Perwira Pengawas (PAWAS / Komando)',
          description: 'Pusat kendali komando, monitoring live map radar 110, disposisi taktis dan validasi laporan BAP.',
          display_order: 2,
        },
        {
          key: 'PERSONIL',
          label: 'Personel Operasional Lapangan',
          description: 'Penerimaan tugas lapangan, e-logbook kedinasan, update status TKP, dan telemetri GPS aktif.',
          display_order: 3,
        },
        {
          key: 'OPERATOR_110',
          label: 'Operator Sentra Layanan 110 (CAD)',
          description: 'Penerimaan panggilan telepon darurat 110, input pengaduan masyarakat, dan verifikasi awal kejadian.',
          display_order: 4,
        },
      ];
      for (const ro of defaultRoles) {
        await prisma.masterRole.create({ data: { ...ro, is_active: true } });
      }
      rows = await prisma.masterRole.findMany({ orderBy: { display_order: 'asc' } });
    }

    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMasterRoleAction(data: {
  key: string;
  label: string;
  description?: string;
  display_order: number;
  is_active: boolean;
}) {
  try {
    const cleanKey = data.key.trim().toUpperCase();
    if (!cleanKey || !data.label.trim()) {
      return { success: false, error: 'Kode Role dan Label peran wajib diisi!' };
    }

    const created = await prisma.masterRole.create({
      data: {
        key: cleanKey,
        label: data.label.trim(),
        description: data.description?.trim() || null,
        display_order: Number(data.display_order) || 1,
        is_active: Boolean(data.is_active),
      },
    });

    await auditLog('CREATE_MASTER_ROLE', `Menambahkan master role baru: ${created.key} - ${created.label}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(created) };
  } catch (error: any) {
    return { success: false, error: error.message?.includes('Unique') ? 'Kode Role sudah terdaftar!' : error.message };
  }
}

export async function updateMasterRoleAction(
  id: number,
  data: { key: string; label: string; description?: string; display_order: number; is_active: boolean }
) {
  try {
    const updated = await prisma.masterRole.update({
      where: { id: Number(id) },
      data: {
        key: data.key.trim().toUpperCase(),
        label: data.label.trim(),
        description: data.description?.trim() || null,
        display_order: Number(data.display_order) || 1,
        is_active: Boolean(data.is_active),
      },
    });

    await auditLog('UPDATE_MASTER_ROLE', `Memperbarui master role ID ${id}: ${updated.key} - ${updated.label}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMasterRoleAction(id: number) {
  try {
    const deleted = await prisma.masterRole.delete({
      where: { id: Number(id) },
    });
    await auditLog('DELETE_MASTER_ROLE', `Menghapus master role ID ${id}: ${deleted.key} - ${deleted.label}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 5. MASTER KANTOR POLISI & JURISDIKSI (police_stations)
// ==============================================================================
export async function getPoliceStationsMasterAction() {
  try {
    let rows = await prisma.policeStation.findMany({
      orderBy: { id: 'asc' },
    });

    if (rows.length === 0) {
      const defaultStations = [
        {
          station_code: 'POLRES-JAKSEL',
          station_name: 'Polres Metro Jakarta Selatan',
          station_level: 'POLRES',
          address: 'Jl. Wijaya II No. 42, Kebayoran Baru, Jakarta Selatan',
          office_lat: -6.2415,
          office_lng: 106.8021,
          geofence_radius_meters: 1000,
        },
        {
          station_code: 'POLSEK-KBY-BARU',
          station_name: 'Polsek Metro Kebayoran Baru',
          station_level: 'POLSEK',
          address: 'Jl. Kyai Maja No. 3, Kebayoran Baru, Jakarta Selatan',
          office_lat: -6.2443,
          office_lng: 106.7985,
          geofence_radius_meters: 500,
        },
        {
          station_code: 'POLSEK-TEBET',
          station_name: 'Polsek Metro Tebet',
          station_level: 'POLSEK',
          address: 'Jl. Prof. DR. Soepomo No. 25, Tebet, Jakarta Selatan',
          office_lat: -6.2312,
          office_lng: 106.8485,
          geofence_radius_meters: 500,
        },
        {
          station_code: 'POLSEK-SETIABUDI',
          station_name: 'Polsek Metro Setiabudi',
          station_level: 'POLSEK',
          address: 'Jl. Karbela Selatan No. 1, Karet Kuningan, Setiabudi',
          office_lat: -6.2165,
          office_lng: 106.8285,
          geofence_radius_meters: 500,
        },
        {
          station_code: 'POSPOL-SENAYAN',
          station_name: 'Pos Polisi Bundaran Senayan',
          station_level: 'POSPOL',
          address: 'Jl. Jend. Sudirman, Senayan, Kebayoran Baru',
          office_lat: -6.2255,
          office_lng: 106.8012,
          geofence_radius_meters: 300,
        },
        {
          station_code: 'POSPOL-KEMANG',
          station_name: 'Pos Polisi Kemang Raya',
          station_level: 'POSPOL',
          address: 'Jl. Kemang Raya No. 10, Bangka, Mampang Prapatan',
          office_lat: -6.2612,
          office_lng: 106.8145,
          geofence_radius_meters: 300,
        },
      ];
      for (const s of defaultStations) {
        await prisma.policeStation.create({ data: s });
      }
      rows = await prisma.policeStation.findMany({ orderBy: { id: 'asc' } });
    }

    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createPoliceStationMasterAction(data: {
  station_code: string;
  station_name: string;
  station_level: string;
  address: string;
  office_lat: number;
  office_lng: number;
  geofence_radius_meters: number;
}) {
  try {
    const cleanCode = data.station_code.trim().toUpperCase();
    if (!cleanCode || !data.station_name.trim()) {
      return { success: false, error: 'Kode Kantor dan Nama Kantor Polisi wajib diisi!' };
    }

    const created = await prisma.policeStation.create({
      data: {
        station_code: cleanCode,
        station_name: data.station_name.trim(),
        station_level: data.station_level || 'POLSEK',
        address: data.address.trim() || '-',
        office_lat: Number(data.office_lat) || -6.2415,
        office_lng: Number(data.office_lng) || 106.8021,
        geofence_radius_meters: Number(data.geofence_radius_meters) || 500,
      },
    });

    await auditLog('CREATE_POLICE_STATION', `Menambahkan kantor polisi baru: ${created.station_code} - ${created.station_name}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(created) };
  } catch (error: any) {
    return { success: false, error: error.message?.includes('Unique') ? 'Kode Kantor Polisi sudah digunakan!' : error.message };
  }
}

export async function updatePoliceStationMasterAction(
  id: number,
  data: {
    station_code: string;
    station_name: string;
    station_level: string;
    address: string;
    office_lat: number;
    office_lng: number;
    geofence_radius_meters: number;
  }
) {
  try {
    const updated = await prisma.policeStation.update({
      where: { id: Number(id) },
      data: {
        station_code: data.station_code.trim().toUpperCase(),
        station_name: data.station_name.trim(),
        station_level: data.station_level || 'POLSEK',
        address: data.address.trim() || '-',
        office_lat: Number(data.office_lat) || -6.2415,
        office_lng: Number(data.office_lng) || 106.8021,
        geofence_radius_meters: Number(data.geofence_radius_meters) || 500,
      },
    });

    await auditLog('UPDATE_POLICE_STATION', `Memperbarui kantor polisi ID ${id}: ${updated.station_code} - ${updated.station_name}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePoliceStationMasterAction(id: number) {
  try {
    const deleted = await prisma.policeStation.delete({
      where: { id: Number(id) },
    });
    await auditLog('DELETE_POLICE_STATION', `Menghapus kantor polisi ID ${id}: ${deleted.station_code} - ${deleted.station_name}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 6. MASTER KATEGORI KEJADIAN / INSIDEN (master_incident_categories)
// ==============================================================================
export async function getMasterIncidentCategoriesAction() {
  try {
    let rows = await prisma.masterIncidentCategory.findMany({
      orderBy: { display_order: 'asc' },
    });

    if (rows.length === 0) {
      const defaults = [
        { key: 'KRIMINALITAS', label: 'Kriminalitas & 3C', icon: '🚨', badge_bg: '#FEF2F2', badge_color: '#DC2626', badge_border: '#FECACA', display_order: 1 },
        { key: 'KAMTIBMAS', label: 'Kamtibmas & Tawuran', icon: '👥', badge_bg: '#FFFBEB', badge_color: '#D97706', badge_border: '#FDE68A', display_order: 2 },
        { key: 'LAKALANTAS', label: 'Laka & Kemacetan Lantas', icon: '🚦', badge_bg: '#EFF6FF', badge_color: '#2563EB', badge_border: '#BFDBFE', display_order: 3 },
        { key: 'BENCANA', label: 'Darurat & Bencana Alam', icon: '🔥', badge_bg: '#FEF2F2', badge_color: '#EA580C', badge_border: '#FED7AA', display_order: 4 },
        { key: 'PELAYANAN_PUBLIK', label: 'Pelayanan Publik & Walk-in', icon: '📋', badge_bg: '#F8FAFC', badge_color: '#475569', badge_border: '#CBD5E1', display_order: 5 },
      ];
      for (const cat of defaults) {
        await prisma.masterIncidentCategory.create({ data: { ...cat, is_active: true } });
      }
      rows = await prisma.masterIncidentCategory.findMany({ orderBy: { display_order: 'asc' } });
    }

    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMasterIncidentCategoryAction(data: {
  key: string;
  label: string;
  icon?: string;
  badge_bg?: string;
  badge_color?: string;
  badge_border?: string;
  display_order: number;
  is_active: boolean;
}) {
  try {
    const cleanKey = data.key.trim().toUpperCase();
    if (!cleanKey || !data.label.trim()) {
      return { success: false, error: 'Kode Kategori dan Label wajib diisi!' };
    }

    const created = await prisma.masterIncidentCategory.create({
      data: {
        key: cleanKey,
        label: data.label.trim(),
        icon: data.icon?.trim() || '🚨',
        badge_bg: data.badge_bg?.trim() || '#EFF6FF',
        badge_color: data.badge_color?.trim() || '#1D4ED8',
        badge_border: data.badge_border?.trim() || '#BFDBFE',
        display_order: Number(data.display_order) || 1,
        is_active: Boolean(data.is_active),
      },
    });

    await auditLog('CREATE_INCIDENT_CATEGORY', `Menambahkan kategori insiden baru: ${created.key} - ${created.label}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(created) };
  } catch (error: any) {
    return { success: false, error: error.message?.includes('Unique') ? 'Kode kategori sudah ada!' : error.message };
  }
}

export async function updateMasterIncidentCategoryAction(
  id: number,
  data: {
    key: string;
    label: string;
    icon?: string;
    badge_bg?: string;
    badge_color?: string;
    badge_border?: string;
    display_order: number;
    is_active: boolean;
  }
) {
  try {
    const updated = await prisma.masterIncidentCategory.update({
      where: { id: Number(id) },
      data: {
        key: data.key.trim().toUpperCase(),
        label: data.label.trim(),
        icon: data.icon?.trim() || '🚨',
        badge_bg: data.badge_bg?.trim() || '#EFF6FF',
        badge_color: data.badge_color?.trim() || '#1D4ED8',
        badge_border: data.badge_border?.trim() || '#BFDBFE',
        display_order: Number(data.display_order) || 1,
        is_active: Boolean(data.is_active),
      },
    });

    await auditLog('UPDATE_INCIDENT_CATEGORY', `Memperbarui kategori insiden ID ${id}: ${updated.key} - ${updated.label}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMasterIncidentCategoryAction(id: number) {
  try {
    const deleted = await prisma.masterIncidentCategory.delete({
      where: { id: Number(id) },
    });
    await auditLog('DELETE_INCIDENT_CATEGORY', `Menghapus kategori insiden ID ${id}: ${deleted.key} - ${deleted.label}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 6.1 MASTER SUB-KATEGORI KASUS SATUAN UNIT (master_incident_subcategories - SMART CAD)
// ==============================================================================
export async function getMasterIncidentSubcategoriesAction(params?: {
  categoryId?: number;
  categoryKey?: string;
  unitKey?: string;
}) {
  try {
    const where: any = { is_active: true };
    if (params?.categoryId) where.category_id = Number(params.categoryId);
    if (params?.categoryKey) where.category_key = params.categoryKey.toUpperCase();
    if (params?.unitKey) where.unit_key = params.unitKey.toLowerCase();

    const rows = await prisma.masterIncidentSubcategory.findMany({
      where,
      orderBy: [{ category_key: 'asc' }, { display_order: 'asc' }],
      include: {
        category_rel: {
          select: { id: true, key: true, label: true, icon: true, badge_bg: true, badge_color: true },
        },
        unit_rel: {
          select: { id: true, key: true, short_name: true, unit_name: true, icon_emoji: true },
        },
      },
    });

    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMasterIncidentSubcategoryAction(data: {
  category_id: number;
  category_key: string;
  unit_id: number;
  unit_key: string;
  nama_kasus: string;
  default_urgensi: string;
  deskripsi_sop?: string;
  display_order: number;
  is_active: boolean;
}) {
  try {
    const created = await prisma.masterIncidentSubcategory.create({
      data: {
        category_id: Number(data.category_id),
        category_key: data.category_key.toUpperCase(),
        unit_id: Number(data.unit_id),
        unit_key: data.unit_key.toLowerCase(),
        nama_kasus: data.nama_kasus.trim(),
        default_urgensi: data.default_urgensi || 'SEDANG',
        deskripsi_sop: data.deskripsi_sop?.trim(),
        display_order: Number(data.display_order) || 1,
        is_active: Boolean(data.is_active),
      },
    });

    await auditLog('CREATE_INCIDENT_SUBCATEGORY', `Menambahkan sub-kategori kasus baru: ${created.nama_kasus} (${created.unit_key})`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(created) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateMasterIncidentSubcategoryAction(
  id: number,
  data: Partial<{
    category_id: number;
    category_key: string;
    unit_id: number;
    unit_key: string;
    nama_kasus: string;
    default_urgensi: string;
    deskripsi_sop: string;
    display_order: number;
    is_active: boolean;
  }>
) {
  try {
    const updated = await prisma.masterIncidentSubcategory.update({
      where: { id: Number(id) },
      data: {
        ...(data.category_id ? { category_id: Number(data.category_id) } : {}),
        ...(data.category_key ? { category_key: data.category_key.toUpperCase() } : {}),
        ...(data.unit_id ? { unit_id: Number(data.unit_id) } : {}),
        ...(data.unit_key ? { unit_key: data.unit_key.toLowerCase() } : {}),
        ...(data.nama_kasus ? { nama_kasus: data.nama_kasus.trim() } : {}),
        ...(data.default_urgensi ? { default_urgensi: data.default_urgensi } : {}),
        ...(data.deskripsi_sop !== undefined ? { deskripsi_sop: data.deskripsi_sop?.trim() } : {}),
        ...(data.display_order ? { display_order: Number(data.display_order) } : {}),
        ...(data.is_active !== undefined ? { is_active: Boolean(data.is_active) } : {}),
      },
    });

    await auditLog('UPDATE_INCIDENT_SUBCATEGORY', `Memperbarui sub-kategori kasus ID ${id}: ${updated.nama_kasus}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMasterIncidentSubcategoryAction(id: number) {
  try {
    const deleted = await prisma.masterIncidentSubcategory.delete({
      where: { id: Number(id) },
    });
    await auditLog('DELETE_INCIDENT_SUBCATEGORY', `Menghapus sub-kategori kasus ID ${id}: ${deleted.nama_kasus}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 7. MASTER TITIK RAWAN / HOTSPOT (master_hotspot_categories)
// ==============================================================================
export async function getMasterHotspotCategoriesAction() {
  try {
    let rows = await prisma.masterHotspotCategory.findMany({
      orderBy: { display_order: 'asc' },
    });

    if (rows.length === 0) {
      const defaults = [
        { key: 'TAWURAN', label: 'Rawan Tawuran Warga & Gesekan Kelompok', icon_emoji: '🔴', display_order: 1 },
        { key: 'BALAP_LIAR', label: 'Rawan Balap Liar Malam Hari', icon_emoji: '🏍️', display_order: 2 },
        { key: 'TIGA_C', label: 'Rawan Curas / Curat / Curanmor (3C)', icon_emoji: '⚠️', display_order: 3 },
        { key: 'NARKOBA', label: 'Rawan Peredaran Gelap Narkotika', icon_emoji: '🟣', display_order: 4 },
        { key: 'KEMACETAN', label: 'Titik Kemacetan Kronis Jam Sibuk', icon_emoji: '🚗', display_order: 5 },
      ];
      for (const h of defaults) {
        await prisma.masterHotspotCategory.create({ data: { ...h, is_active: true } });
      }
      rows = await prisma.masterHotspotCategory.findMany({ orderBy: { display_order: 'asc' } });
    }

    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMasterHotspotCategoryAction(data: {
  key: string;
  label: string;
  icon_emoji?: string;
  display_order: number;
  is_active: boolean;
}) {
  try {
    const cleanKey = data.key.trim().toUpperCase();
    if (!cleanKey || !data.label.trim()) {
      return { success: false, error: 'Kode dan Label kategori rawan wajib diisi!' };
    }

    const created = await prisma.masterHotspotCategory.create({
      data: {
        key: cleanKey,
        label: data.label.trim(),
        icon_emoji: data.icon_emoji?.trim() || '🔴',
        display_order: Number(data.display_order) || 1,
        is_active: Boolean(data.is_active),
      },
    });

    await auditLog('CREATE_HOTSPOT_CATEGORY', `Menambahkan kategori titik rawan: ${created.key} - ${created.label}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(created) };
  } catch (error: any) {
    return { success: false, error: error.message?.includes('Unique') ? 'Kode titik rawan sudah ada!' : error.message };
  }
}

export async function updateMasterHotspotCategoryAction(
  id: number,
  data: {
    key: string;
    label: string;
    icon_emoji?: string;
    display_order: number;
    is_active: boolean;
  }
) {
  try {
    const updated = await prisma.masterHotspotCategory.update({
      where: { id: Number(id) },
      data: {
        key: data.key.trim().toUpperCase(),
        label: data.label.trim(),
        icon_emoji: data.icon_emoji?.trim() || '🔴',
        display_order: Number(data.display_order) || 1,
        is_active: Boolean(data.is_active),
      },
    });

    await auditLog('UPDATE_HOTSPOT_CATEGORY', `Memperbarui kategori titik rawan ID ${id}: ${updated.key} - ${updated.label}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMasterHotspotCategoryAction(id: number) {
  try {
    const deleted = await prisma.masterHotspotCategory.delete({
      where: { id: Number(id) },
    });
    await auditLog('DELETE_HOTSPOT_CATEGORY', `Menghapus kategori titik rawan ID ${id}: ${deleted.key} - ${deleted.label}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 8. MASTER STATUS KEDINASAN (master_duty_statuses)
// ==============================================================================
export async function getMasterDutyStatusesAction() {
  try {
    let rows = await prisma.masterDutyStatus.findMany({
      orderBy: { display_order: 'asc' },
    });

    if (rows.length === 0) {
      const defaults = [
        { key: 'DINAS_PATROLI', label: 'Dinas Patroli Tergelar', badge_color: '#10B981', badge_bg: '#ECFDF5', display_order: 1 },
        { key: 'PIKET_SPKT', label: 'Piket Siaga SPKT Mako', badge_color: '#2563EB', badge_bg: '#EFF6FF', display_order: 2 },
        { key: 'CADANGAN', label: 'Cadangan Siaga Panggilan PLB', badge_color: '#F59E0B', badge_bg: '#FEF3C7', display_order: 3 },
        { key: 'LEPAS_DINAS', label: 'Lepas Dinas / Istirahat', badge_color: '#64748B', badge_bg: '#F1F5F9', display_order: 4 },
        { key: 'BKO', label: 'Penugasan BKO Kewilayahan', badge_color: '#8B5CF6', badge_bg: '#F5F3FF', display_order: 5 },
      ];
      for (const st of defaults) {
        await prisma.masterDutyStatus.create({ data: { ...st, is_active: true } });
      }
      rows = await prisma.masterDutyStatus.findMany({ orderBy: { display_order: 'asc' } });
    }

    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMasterDutyStatusAction(data: {
  key: string;
  label: string;
  badge_color?: string;
  badge_bg?: string;
  display_order: number;
  is_active: boolean;
}) {
  try {
    const cleanKey = data.key.trim().toUpperCase();
    if (!cleanKey || !data.label.trim()) {
      return { success: false, error: 'Kode status dan Label kedinasan wajib diisi!' };
    }

    const created = await prisma.masterDutyStatus.create({
      data: {
        key: cleanKey,
        label: data.label.trim(),
        badge_color: data.badge_color?.trim() || '#10B981',
        badge_bg: data.badge_bg?.trim() || '#ECFDF5',
        display_order: Number(data.display_order) || 1,
        is_active: Boolean(data.is_active),
      },
    });

    await auditLog('CREATE_DUTY_STATUS', `Menambahkan master status tugas: ${created.key} - ${created.label}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(created) };
  } catch (error: any) {
    return { success: false, error: error.message?.includes('Unique') ? 'Kode status sudah ada!' : error.message };
  }
}

export async function updateMasterDutyStatusAction(
  id: number,
  data: {
    key: string;
    label: string;
    badge_color?: string;
    badge_bg?: string;
    display_order: number;
    is_active: boolean;
  }
) {
  try {
    const updated = await prisma.masterDutyStatus.update({
      where: { id: Number(id) },
      data: {
        key: data.key.trim().toUpperCase(),
        label: data.label.trim(),
        badge_color: data.badge_color?.trim() || '#10B981',
        badge_bg: data.badge_bg?.trim() || '#ECFDF5',
        display_order: Number(data.display_order) || 1,
        is_active: Boolean(data.is_active),
      },
    });

    await auditLog('UPDATE_DUTY_STATUS', `Memperbarui status tugas ID ${id}: ${updated.key} - ${updated.label}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMasterDutyStatusAction(id: number) {
  try {
    const deleted = await prisma.masterDutyStatus.delete({
      where: { id: Number(id) },
    });
    await auditLog('DELETE_DUTY_STATUS', `Menghapus status tugas ID ${id}: ${deleted.key} - ${deleted.label}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 9. MASTER TITIK RAWAN GIS / LOKASI RAWAN KRIMINALITAS (hotspot_locations)
// ==============================================================================
export async function getMasterHotspotsAction() {
  try {
    let rows = await prisma.hotspotLocation.findMany({
      orderBy: { created_at: 'desc' },
    });

    if (rows.length === 0) {
      const defaults = [
        {
          key: 'HS-CSW-01',
          title: 'Simpang CSW - Blok M & Taman Martha Tiahahu',
          police_sector: 'Polsek Kebayoran Baru',
          category: 'TAWURAN',
          danger_level: 'PENGAWASAN_PRIORITAS',
          icon_emoji: '⚔️',
          lat: -6.2415,
          lng: 106.8021,
          active_start: '22:00',
          active_end: '04:30',
          schedule_display: '22:00 - 04:30 WIB',
          nearest_unit: 'Tim Perintis Presisi R2-12',
        },
        {
          key: 'HS-ANTASARI-02',
          title: 'Underpass & Flyover Pangeran Antasari',
          police_sector: 'Polsek Kebayoran Baru',
          category: 'BALAP_LIAR',
          danger_level: 'SIAGA_BLUE_LIGHT',
          icon_emoji: '🏍️',
          lat: -6.2625,
          lng: 106.8123,
          active_start: '00:00',
          active_end: '04:30',
          schedule_display: '00:00 - 04:30 WIB',
          nearest_unit: 'Unit Patroli Lalu Lintas PJR-01',
        },
        {
          key: 'HS-FATMAWATI-03',
          title: 'Kawasan Stasiun MRT Fatmawati & Simpang TB Simatupang',
          police_sector: 'Polsek Cilandak',
          category: 'TIGA_C',
          danger_level: 'PENGAWASAN_PRIORITAS',
          icon_emoji: '🚨',
          lat: -6.2925,
          lng: 106.7972,
          active_start: '21:00',
          active_end: '05:00',
          schedule_display: '21:00 - 05:00 WIB',
          nearest_unit: 'Patroli Samapta 110-A',
        },
        {
          key: 'HS-MANGGARAI-04',
          title: 'Underpass & Jembatan Kereta Manggarai',
          police_sector: 'Polsek Tebet',
          category: 'TAWURAN',
          danger_level: 'DARURAT_110',
          icon_emoji: '🔥',
          lat: -6.2098,
          lng: 106.8502,
          active_start: '23:00',
          active_end: '05:00',
          schedule_display: '23:00 - 05:00 WIB',
          nearest_unit: 'Regu Sabhara Presisi Tebet',
        },
        {
          key: 'HS-KEMANG-05',
          title: 'Koridor Hiburan Malam Kemang Raya',
          police_sector: 'Polsek Mampang Prapatan',
          category: 'KEMACETAN',
          danger_level: 'PEMANTAUAN_RUTIN',
          icon_emoji: '🚗',
          lat: -6.2611,
          lng: 106.8155,
          active_start: '22:00',
          active_end: '03:30',
          schedule_display: '22:00 - 03:30 WIB',
          nearest_unit: 'Unit Patroli Lantas Mampang',
        },
      ];

      for (const h of defaults) {
        await prisma.hotspotLocation.create({
          data: {
            key: h.key,
            title: h.title,
            police_sector: h.police_sector,
            category: h.category,
            danger_level: h.danger_level,
            icon_emoji: h.icon_emoji,
            lat: h.lat,
            lng: h.lng,
            active_start: h.active_start,
            active_end: h.active_end,
            schedule_display: h.schedule_display,
            nearest_unit: h.nearest_unit,
          },
        });
      }

      rows = await prisma.hotspotLocation.findMany({
        orderBy: { created_at: 'desc' },
      });
    }

    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMasterHotspotAction(data: {
  key: string;
  title: string;
  police_sector: string;
  category: string;
  danger_level: string;
  icon_emoji?: string;
  lat: number;
  lng: number;
  active_start?: string;
  active_end?: string;
  schedule_display?: string;
  nearest_unit?: string;
}) {
  try {
    const cleanKey = data.key.trim().toUpperCase();
    if (!cleanKey || !data.title.trim()) {
      return { success: false, error: 'Kode dan Nama Titik Rawan wajib diisi!' };
    }

    const created = await prisma.hotspotLocation.create({
      data: {
        key: cleanKey,
        title: data.title.trim(),
        police_sector: data.police_sector?.trim() || 'Wilayah Hukum Polres',
        category: data.category?.trim().toUpperCase() || 'TAWURAN',
        danger_level: data.danger_level?.trim() || 'PENGAWASAN_PRIORITAS',
        icon_emoji: data.icon_emoji?.trim() || '🔴',
        lat: Number(data.lat) || -6.2415,
        lng: Number(data.lng) || 106.8021,
        active_start: data.active_start?.trim() || '23:00',
        active_end: data.active_end?.trim() || '04:30',
        schedule_display:
          data.schedule_display?.trim() ||
          `${data.active_start || '23:00'} - ${data.active_end || '04:30'} WIB`,
        nearest_unit: data.nearest_unit?.trim() || '-',
      },
    });

    await auditLog('CREATE_HOTSPOT', `Menambahkan titik rawan GIS baru: ${created.key} - ${created.title}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(created) };
  } catch (error: any) {
    return { success: false, error: error.message?.includes('Unique') ? 'Kode titik rawan sudah terdaftar!' : error.message };
  }
}

export async function updateMasterHotspotAction(
  id: number | string,
  data: {
    key: string;
    title: string;
    police_sector: string;
    category: string;
    danger_level: string;
    icon_emoji?: string;
    lat: number;
    lng: number;
    active_start?: string;
    active_end?: string;
    schedule_display?: string;
    nearest_unit?: string;
  }
) {
  try {
    const updated = await prisma.hotspotLocation.update({
      where: { id: BigInt(id) },
      data: {
        key: data.key.trim().toUpperCase(),
        title: data.title.trim(),
        police_sector: data.police_sector?.trim() || 'Wilayah Hukum Polres',
        category: data.category?.trim().toUpperCase() || 'TAWURAN',
        danger_level: data.danger_level?.trim() || 'PENGAWASAN_PRIORITAS',
        icon_emoji: data.icon_emoji?.trim() || '🔴',
        lat: Number(data.lat) || -6.2415,
        lng: Number(data.lng) || 106.8021,
        active_start: data.active_start?.trim() || '23:00',
        active_end: data.active_end?.trim() || '04:30',
        schedule_display:
          data.schedule_display?.trim() ||
          `${data.active_start || '23:00'} - ${data.active_end || '04:30'} WIB`,
        nearest_unit: data.nearest_unit?.trim() || '-',
      },
    });

    await auditLog('UPDATE_HOTSPOT', `Memperbarui titik rawan GIS ID ${id}: ${updated.key} - ${updated.title}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMasterHotspotAction(id: number | string) {
  try {
    const deleted = await prisma.hotspotLocation.delete({
      where: { id: BigInt(id) },
    });
    await auditLog('DELETE_HOTSPOT', `Menghapus titik rawan GIS ID ${id}: ${deleted.key} - ${deleted.title}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 10. MASTER ARMADA OPERASIONAL / KENDARAAN PATROLI (patrol_vehicles)
// ==============================================================================
export async function getMasterVehiclesAction() {
  try {
    let rows = await prisma.patrolVehicle.findMany({
      orderBy: { id: 'asc' },
    });

    if (rows.length === 0) {
      const defaults = [
        {
          nomor_lambung: 'R4-SAMAPTA-01',
          nama_armada: 'Mobil Patroli Samapta Presisi R4-01',
          jenis_kendaraan: 'RODA_4',
          plat_nomor_polisi: '1001-VII',
          qr_token: 'QR-VEH-SAMAPTA-01',
          icon_emoji: '🚔',
          status_operasional: 'SIAGA',
          status_color: '#10B981',
          driver_officer_nrp: '95020123',
          current_lat: -6.2415,
          current_lng: 106.8021,
          speed_kmh: 0,
        },
        {
          nomor_lambung: 'R4-LANTAS-PJR',
          nama_armada: 'Unit Patroli Lalu Lintas PJR Sedan-01',
          jenis_kendaraan: 'RODA_4',
          plat_nomor_polisi: '1002-VII',
          qr_token: 'QR-VEH-LANTAS-01',
          icon_emoji: '🚓',
          status_operasional: 'PATROLI',
          status_color: '#3B82F6',
          driver_officer_nrp: '82050411',
          current_lat: -6.2625,
          current_lng: 106.8123,
          speed_kmh: 35,
        },
        {
          nomor_lambung: 'R2-PERINTIS-12',
          nama_armada: 'Motor Trail Perintis Presisi Samapta R2-12',
          jenis_kendaraan: 'RODA_2',
          plat_nomor_polisi: '2101-VII',
          qr_token: 'QR-VEH-PERINTIS-12',
          icon_emoji: '🏍️',
          status_operasional: 'SIAGA',
          status_color: '#10B981',
          driver_officer_nrp: '78091122',
          current_lat: -6.2435,
          current_lng: 106.8041,
          speed_kmh: 0,
        },
        {
          nomor_lambung: 'R4-RESKRIM-OPS',
          nama_armada: 'Kendaraan Taktis Reskrim Opsnal & Resmob',
          jenis_kendaraan: 'MINIBUS',
          plat_nomor_polisi: '3001-VII',
          qr_token: 'QR-VEH-RESKRIM-01',
          icon_emoji: '🚐',
          status_operasional: 'SIAGA',
          status_color: '#10B981',
          driver_officer_nrp: '89110255',
          current_lat: -6.2415,
          current_lng: 106.8021,
          speed_kmh: 0,
        },
        {
          nomor_lambung: 'R2-BHABINKAMTIBMAS-05',
          nama_armada: 'Motor Dinas Bhabinkamtibmas Polsek',
          jenis_kendaraan: 'RODA_2',
          plat_nomor_polisi: '2205-VII',
          qr_token: 'QR-VEH-BHABIN-05',
          icon_emoji: '🛵',
          status_operasional: 'PATROLI',
          status_color: '#3B82F6',
          driver_officer_nrp: '86040899',
          current_lat: -6.2515,
          current_lng: 106.8088,
          speed_kmh: 20,
        },
      ];

      for (const v of defaults) {
        await prisma.patrolVehicle.create({
          data: {
            nomor_lambung: v.nomor_lambung,
            nama_armada: v.nama_armada,
            jenis_kendaraan: v.jenis_kendaraan,
            plat_nomor_polisi: v.plat_nomor_polisi,
            qr_token: v.qr_token,
            icon_emoji: v.icon_emoji,
            status_operasional: v.status_operasional,
            status_color: v.status_color,
            driver_officer_nrp: v.driver_officer_nrp,
            current_lat: v.current_lat,
            current_lng: v.current_lng,
            speed_kmh: v.speed_kmh,
          },
        });
      }

      rows = await prisma.patrolVehicle.findMany({
        orderBy: { id: 'asc' },
      });
    }

    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMasterVehicleAction(data: {
  nomor_lambung: string;
  nama_armada: string;
  jenis_kendaraan: string;
  plat_nomor_polisi?: string;
  icon_emoji?: string;
  status_operasional?: string;
  driver_officer_nrp?: string;
  current_lat?: number;
  current_lng?: number;
}) {
  try {
    const lambung = data.nomor_lambung.trim().toUpperCase();
    if (!lambung || !data.nama_armada.trim()) {
      return { success: false, error: 'Nomor lambung dan Nama armada wajib diisi!' };
    }

    const qrToken = `QR-VEH-${lambung.replace(/[^A-Z0-9]/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const statusColors: Record<string, string> = {
      SIAGA: '#10B981',
      PATROLI: '#3B82F6',
      MENUJU_TKP: '#EF4444',
      PEMELIHARAAN: '#6B7280',
    };
    const statusOp = data.status_operasional?.trim().toUpperCase() || 'SIAGA';

    const created = await prisma.patrolVehicle.create({
      data: {
        nomor_lambung: lambung,
        nama_armada: data.nama_armada.trim(),
        jenis_kendaraan: data.jenis_kendaraan?.trim() || 'RODA_4',
        plat_nomor_polisi: data.plat_nomor_polisi?.trim().toUpperCase() || null,
        qr_token: qrToken,
        icon_emoji: data.icon_emoji?.trim() || '🚔',
        status_operasional: statusOp,
        status_color: statusColors[statusOp] || '#10B981',
        driver_officer_nrp: data.driver_officer_nrp?.trim() || null,
        current_lat: data.current_lat != null ? Number(data.current_lat) : null,
        current_lng: data.current_lng != null ? Number(data.current_lng) : null,
      },
    });

    await auditLog('CREATE_VEHICLE', `Mendaftarkan armada patroli baru: ${created.nomor_lambung} - ${created.nama_armada}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(created) };
  } catch (error: any) {
    return { success: false, error: error.message?.includes('Unique') ? 'Nomor lambung sudah terdaftar!' : error.message };
  }
}

export async function updateMasterVehicleAction(
  id: number,
  data: {
    nomor_lambung: string;
    nama_armada: string;
    jenis_kendaraan: string;
    plat_nomor_polisi?: string;
    icon_emoji?: string;
    status_operasional?: string;
    driver_officer_nrp?: string;
    current_lat?: number;
    current_lng?: number;
  }
) {
  try {
    const statusColors: Record<string, string> = {
      SIAGA: '#10B981',
      PATROLI: '#3B82F6',
      MENUJU_TKP: '#EF4444',
      PEMELIHARAAN: '#6B7280',
    };
    const statusOp = data.status_operasional?.trim().toUpperCase() || 'SIAGA';

    const updated = await prisma.patrolVehicle.update({
      where: { id: Number(id) },
      data: {
        nomor_lambung: data.nomor_lambung.trim().toUpperCase(),
        nama_armada: data.nama_armada.trim(),
        jenis_kendaraan: data.jenis_kendaraan?.trim() || 'RODA_4',
        plat_nomor_polisi: data.plat_nomor_polisi?.trim().toUpperCase() || null,
        icon_emoji: data.icon_emoji?.trim() || '🚔',
        status_operasional: statusOp,
        status_color: statusColors[statusOp] || '#10B981',
        driver_officer_nrp: data.driver_officer_nrp?.trim() || null,
        current_lat: data.current_lat != null ? Number(data.current_lat) : null,
        current_lng: data.current_lng != null ? Number(data.current_lng) : null,
      },
    });

    await auditLog('UPDATE_VEHICLE', `Memperbarui armada patroli ID ${id}: ${updated.nomor_lambung} - ${updated.nama_armada}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMasterVehicleAction(id: number) {
  try {
    const deleted = await prisma.patrolVehicle.delete({
      where: { id: Number(id) },
    });
    await auditLog('DELETE_VEHICLE', `Menghapus armada patroli ID ${id}: ${deleted.nomor_lambung} - ${deleted.nama_armada}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
