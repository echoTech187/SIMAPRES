'use server';

import { prisma, serializeBigInt, auditLog, parsePositiveIntId, revalidatePath, requireSuperadmin } from './master-common';

// ==============================================================================
// 1. MASTER PANGKAT KEPOLISIAN (master_ranks)
// ==============================================================================
export async function getMasterRanksAction(params?: { isActive?: boolean; search?: string }) {
  try {
    const where: any = {};
    if (params?.isActive !== undefined) {
      where.is_active = Boolean(params.isActive);
    }
    if (params?.search && typeof params.search === 'string' && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { key: { contains: q } },
        { label: { contains: q } },
      ];
    }
    const rows = await prisma.masterRank.findMany({
      where,
      orderBy: { display_order: 'asc' },
    });
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
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
  try {
    const cleanKey = data.key?.trim().toUpperCase();
    const cleanLabel = data.label?.trim();
    if (!cleanKey || !cleanLabel) {
      return { success: false, error: 'Kode pangkat dan Label wajib diisi!' };
    }

    const created = await prisma.masterRank.create({
      data: {
        key: cleanKey,
        label: cleanLabel,
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
  id: number | string,
  data: { key: string; label: string; display_order?: number; is_active?: boolean }
) {
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
  try {
    const idCheck = parsePositiveIntId(id, 'ID Master Pangkat');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const cleanKey = data.key?.trim().toUpperCase();
    const cleanLabel = data.label?.trim();
    if (!cleanKey || !cleanLabel) {
      return { success: false, error: 'Kode pangkat dan Label wajib diisi!' };
    }

    const updated = await prisma.masterRank.update({
      where: { id: idCheck.value },
      data: {
        key: cleanKey,
        label: cleanLabel,
        display_order: data.display_order !== undefined ? Number(data.display_order) : undefined,
        is_active: data.is_active !== undefined ? Boolean(data.is_active) : undefined,
      },
    });

    await auditLog('UPDATE_MASTER_RANK', `Memperbarui master pangkat ID ${id}: ${updated.key} - ${updated.label}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMasterRankAction(id: number | string) {
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
  try {
    const idCheck = parsePositiveIntId(id, 'ID Master Pangkat');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const deleted = await prisma.masterRank.delete({
      where: { id: idCheck.value },
    });
    await auditLog('DELETE_MASTER_RANK', `Menghapus master pangkat ID ${id}: ${deleted.key} - ${deleted.label}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 2. MASTER ROLE / HAK AKSES SISTEM (master_roles)
// ==============================================================================
export async function getMasterRolesAction(params?: { isActive?: boolean; search?: string }) {
  try {
    const where: any = {};
    if (params?.isActive !== undefined) {
      where.is_active = Boolean(params.isActive);
    }
    if (params?.search && typeof params.search === 'string' && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { key: { contains: q } },
        { label: { contains: q } },
      ];
    }
    const rows = await prisma.masterRole.findMany({
      where,
      orderBy: { display_order: 'asc' },
    });
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
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
  try {
    const cleanKey = data.key?.trim().toUpperCase();
    const cleanLabel = data.label?.trim();
    if (!cleanKey || !cleanLabel) {
      return { success: false, error: 'Kode Role dan Label peran wajib diisi!' };
    }

    const created = await prisma.masterRole.create({
      data: {
        key: cleanKey,
        label: cleanLabel,
        description: data.description?.trim(),
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
  id: number | string,
  data: { key: string; label: string; description?: string; display_order?: number; is_active?: boolean }
) {
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
  try {
    const idCheck = parsePositiveIntId(id, 'ID Master Role');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const cleanKey = data.key?.trim().toUpperCase();
    const cleanLabel = data.label?.trim();
    if (!cleanKey || !cleanLabel) {
      return { success: false, error: 'Kode Role dan Label peran wajib diisi!' };
    }

    const updated = await prisma.masterRole.update({
      where: { id: idCheck.value },
      data: {
        key: cleanKey,
        label: cleanLabel,
        description: data.description?.trim(),
        display_order: data.display_order !== undefined ? Number(data.display_order) : undefined,
        is_active: data.is_active !== undefined ? Boolean(data.is_active) : undefined,
      },
    });

    await auditLog('UPDATE_MASTER_ROLE', `Memperbarui master role ID ${id}: ${updated.key} - ${updated.label}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMasterRoleAction(id: number | string) {
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
  try {
    const idCheck = parsePositiveIntId(id, 'ID Master Role');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const deleted = await prisma.masterRole.delete({
      where: { id: idCheck.value },
    });
    await auditLog('DELETE_MASTER_ROLE', `Menghapus master role ID ${id}: ${deleted.key} - ${deleted.label}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 3. MASTER STATUS KEDINASAN (master_duty_statuses)
// ==============================================================================
export async function getMasterDutyStatusesAction(params?: { isActive?: boolean; search?: string }) {
  try {
    const where: any = {};
    if (params?.isActive !== undefined) {
      where.is_active = Boolean(params.isActive);
    }
    if (params?.search && typeof params.search === 'string' && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { key: { contains: q } },
        { label: { contains: q } },
      ];
    }
    const rows = await prisma.masterDutyStatus.findMany({
      where,
      orderBy: { display_order: 'asc' },
    });
    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMasterDutyStatusAction(data: {
  key: string;
  label: string;
  display_order: number;
  is_active: boolean;
}) {
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
  try {
    const cleanKey = data.key?.trim().toUpperCase();
    const cleanLabel = data.label?.trim();
    if (!cleanKey || !cleanLabel) {
      return { success: false, error: 'Kode status dan Label kedinasan wajib diisi!' };
    }

    const created = await prisma.masterDutyStatus.create({
      data: {
        key: cleanKey,
        label: cleanLabel,
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
  id: number | string,
  data: {
    key: string;
    label: string;
    display_order?: number;
    is_active?: boolean;
  }
) {
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
  try {
    const idCheck = parsePositiveIntId(id, 'ID Status Kedinasan');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const cleanKey = data.key?.trim().toUpperCase();
    const cleanLabel = data.label?.trim();
    if (!cleanKey || !cleanLabel) {
      return { success: false, error: 'Kode status dan Label kedinasan wajib diisi!' };
    }

    const updated = await prisma.masterDutyStatus.update({
      where: { id: idCheck.value },
      data: {
        key: cleanKey,
        label: cleanLabel,
        display_order: data.display_order !== undefined ? Number(data.display_order) : undefined,
        is_active: data.is_active !== undefined ? Boolean(data.is_active) : undefined,
      },
    });

    await auditLog('UPDATE_DUTY_STATUS', `Memperbarui status tugas ID ${idCheck.value}: ${updated.key} - ${updated.label}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMasterDutyStatusAction(id: number | string) {
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
  try {
    const idCheck = parsePositiveIntId(id, 'ID Status Kedinasan');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const deleted = await prisma.masterDutyStatus.delete({
      where: { id: idCheck.value },
    });
    await auditLog('DELETE_DUTY_STATUS', `Menghapus status tugas ID ${idCheck.value}: ${deleted.key} - ${deleted.label}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 4. MASTER PERAN AWAK REGU PATROLI (BUDDY SYSTEM)
// ==============================================================================
export async function getMasterPatrolCrewRolesAction() {
  try {
    const list = await prisma.masterPatrolCrewRole.findMany({
      orderBy: { display_order: 'asc' },
    });
    return { success: true, data: serializeBigInt(list) };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// ==============================================================================
// 5. MASTER MODA DISPOSISI OPERASIONAL
// ==============================================================================
export async function getMasterDispatchModesAction() {
  try {
    const list = await prisma.masterDispatchMode.findMany({
      orderBy: { display_order: 'asc' },
    });
    return { success: true, data: serializeBigInt(list) };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
