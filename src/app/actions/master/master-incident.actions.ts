'use server';

import { prisma, serializeBigInt, auditLog, parsePositiveIntId, revalidatePath, requireSuperadmin } from './master-common';

// ==============================================================================
// 1. MASTER KATEGORI KEJADIAN / INSIDEN (master_incident_categories)
// ==============================================================================
export async function getMasterIncidentCategoriesAction(params?: { isActive?: boolean; search?: string }) {
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
    const rows = await prisma.masterIncidentCategory.findMany({
      where,
      orderBy: { display_order: 'asc' },
    });
    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMasterIncidentCategoryAction(data: {
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
      return { success: false, error: 'Kode Kategori dan Label wajib diisi!' };
    }
    if (data.display_order === undefined || isNaN(Number(data.display_order))) {
      return { success: false, error: 'Urutan tampilan wajib diisi angka valid!' };
    }

    const created = await prisma.masterIncidentCategory.create({
      data: {
        key: cleanKey,
        label: cleanLabel,
        display_order: Number(data.display_order),
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
    const idCheck = parsePositiveIntId(id, 'ID Kategori Insiden');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const cleanKey = data.key?.trim().toUpperCase();
    const cleanLabel = data.label?.trim();
    if (!cleanKey || !cleanLabel) {
      return { success: false, error: 'Kode Kategori dan Label wajib diisi!' };
    }

    const updatePayload: any = {
      key: cleanKey,
      label: cleanLabel,
    };

    if (data.display_order !== undefined) {
      if (isNaN(Number(data.display_order))) {
        return { success: false, error: 'Urutan tampilan harus berupa angka!' };
      }
      updatePayload.display_order = Number(data.display_order);
    }

    if (data.is_active !== undefined) {
      updatePayload.is_active = Boolean(data.is_active);
    }

    const updated = await prisma.masterIncidentCategory.update({
      where: { id: idCheck.value },
      data: updatePayload,
    });

    await auditLog('UPDATE_INCIDENT_CATEGORY', `Memperbarui kategori insiden ID ${idCheck.value}: ${updated.key} - ${updated.label}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMasterIncidentCategoryAction(id: number | string) {
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
  try {
    const idCheck = parsePositiveIntId(id, 'ID Kategori Insiden');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const deleted = await prisma.masterIncidentCategory.delete({
      where: { id: idCheck.value },
    });
    await auditLog('DELETE_INCIDENT_CATEGORY', `Menghapus kategori insiden ID ${idCheck.value}: ${deleted.key} - ${deleted.label}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 2. MASTER SUB-KATEGORI KASUS SATUAN UNIT (master_incident_subcategories - SMART CAD)
// ==============================================================================
export async function getMasterIncidentSubcategoriesAction(params?: {
  categoryId?: number | string;
  categoryKey?: string;
  unitKey?: string;
  isActive?: boolean;
  search?: string;
}) {
  try {
    const where: any = {};
    if (params?.isActive !== undefined) where.is_active = Boolean(params.isActive);
    if (params?.categoryId !== undefined && params.categoryId !== null && params.categoryId !== '') {
      const catCheck = parsePositiveIntId(params.categoryId, 'ID Kategori Induk');
      if (!catCheck.valid) {
        return { success: false, error: catCheck.error };
      }
      where.category_id = catCheck.value;
    }
    if (params?.categoryKey && typeof params.categoryKey === 'string' && params.categoryKey.trim()) {
      where.category_key = params.categoryKey.trim().toUpperCase();
    }
    if (params?.unitKey && typeof params.unitKey === 'string' && params.unitKey.trim()) {
      where.unit_key = params.unitKey.trim().toLowerCase();
    }
    if (params?.search && typeof params.search === 'string' && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { nama_kasus: { contains: q } },
        { deskripsi_sop: { contains: q } },
      ];
    }

    const rows = await prisma.masterIncidentSubcategory.findMany({
      where,
      orderBy: [{ category_key: 'asc' }, { display_order: 'asc' }],
      include: {
        category_rel: {
          select: { id: true, key: true, label: true },
        },
        unit_rel: {
          select: { id: true, key: true, short_name: true, unit_name: true },
        },
      },
    });

    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMasterIncidentSubcategoryAction(data: {
  category_id: number | string;
  category_key?: string;
  unit_id?: number | string | null;
  unit_key?: string;
  nama_kasus: string;
  default_urgensi?: string;
  deskripsi_sop?: string;
  display_order?: number;
  is_active?: boolean;
}) {
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
  try {
    const cleanKasus = data.nama_kasus?.trim();
    if (!cleanKasus) {
      return { success: false, error: 'Nama rincian kasus / subkategori insiden wajib diisi!' };
    }
    const catCheck = parsePositiveIntId(data.category_id, 'Kategori insiden induk');
    if (!catCheck.valid) return { success: false, error: catCheck.error };

    let categoryKey = data.category_key?.trim();
    if (!categoryKey) {
      const cat = await prisma.masterIncidentCategory.findUnique({
        where: { id: catCheck.value },
        select: { key: true },
      });
      if (cat?.key) {
        categoryKey = cat.key;
      } else {
        return { success: false, error: 'Kode kategori insiden induk wajib diisi!' };
      }
    }

    let unitId = data.unit_id ? Number(data.unit_id) : 0;
    let unitKey = data.unit_key?.trim();
    if (!unitId || isNaN(unitId)) {
      const defaultUnit = await prisma.masterOperationalUnit.findFirst({
        where: { is_active: true },
        select: { id: true, key: true },
      });
      if (defaultUnit) {
        unitId = defaultUnit.id;
        unitKey = defaultUnit.key;
      }
    }

    const unitCheck = parsePositiveIntId(unitId, 'Satuan unit penanggung jawab SOP');
    if (!unitCheck.valid) return { success: false, error: unitCheck.error };

    if (!unitKey) {
      const unit = await prisma.masterOperationalUnit.findUnique({
        where: { id: unitCheck.value },
        select: { key: true },
      });
      if (unit?.key) {
        unitKey = unit.key;
      } else {
        return { success: false, error: 'Kode satuan unit penanggung jawab wajib diisi!' };
      }
    }

    const defaultUrgensi = data.default_urgensi?.trim() || 'NORMAL';

    const created = await prisma.masterIncidentSubcategory.create({
      data: {
        category_id: catCheck.value,
        category_key: (categoryKey || '').toUpperCase(),
        unit_id: unitCheck.value,
        unit_key: (unitKey || '').toLowerCase(),
        nama_kasus: cleanKasus,
        default_urgensi: defaultUrgensi,
        deskripsi_sop: data.deskripsi_sop?.trim(),
        display_order: Number(data.display_order) || 1,
        is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
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
  id: number | string,
  data: Partial<{
    category_id: number | string;
    category_key: string;
    unit_id: number | string;
    unit_key: string;
    nama_kasus: string;
    default_urgensi: string;
    deskripsi_sop: string;
    display_order: number;
    is_active: boolean;
  }>
) {
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
  try {
    const idCheck = parsePositiveIntId(id, 'ID Subkategori Kasus');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const updatePayload: any = {};

    if (data.category_id !== undefined && data.category_id !== null && data.category_id !== '') {
      const catCheck = parsePositiveIntId(data.category_id, 'ID Kategori Induk');
      if (!catCheck.valid) return { success: false, error: catCheck.error };
      updatePayload.category_id = catCheck.value;
      if (!data.category_key?.trim()) {
        const cat = await prisma.masterIncidentCategory.findUnique({
          where: { id: catCheck.value },
          select: { key: true },
        });
        if (cat?.key) {
          updatePayload.category_key = cat.key.toUpperCase();
        }
      }
    }
    if (data.category_key !== undefined && !updatePayload.category_key) {
      const cleanCatKey = data.category_key?.trim().toUpperCase();
      if (!cleanCatKey) return { success: false, error: 'Kode Kategori tidak boleh kosong!' };
      updatePayload.category_key = cleanCatKey;
    }
    if (data.unit_id !== undefined && data.unit_id !== null && data.unit_id !== '') {
      const unitCheck = parsePositiveIntId(data.unit_id, 'ID Satuan Unit');
      if (!unitCheck.valid) return { success: false, error: unitCheck.error };
      updatePayload.unit_id = unitCheck.value;
      if (!data.unit_key?.trim()) {
        const unit = await prisma.masterOperationalUnit.findUnique({
          where: { id: unitCheck.value },
          select: { key: true },
        });
        if (unit?.key) {
          updatePayload.unit_key = unit.key.toLowerCase();
        }
      }
    }
    if (data.unit_key !== undefined && !updatePayload.unit_key) {
      const cleanUnitKey = data.unit_key?.trim().toLowerCase();
      if (!cleanUnitKey) return { success: false, error: 'Kode Satuan tidak boleh kosong!' };
      updatePayload.unit_key = cleanUnitKey;
    }
    if (data.nama_kasus !== undefined) {
      const cleanNama = data.nama_kasus?.trim();
      if (!cleanNama) return { success: false, error: 'Nama rincian kasus tidak boleh kosong!' };
      updatePayload.nama_kasus = cleanNama;
    }
    if (data.default_urgensi !== undefined) {
      const cleanUrgensi = data.default_urgensi?.trim();
      if (!cleanUrgensi) return { success: false, error: 'Tingkat urgensi default tidak boleh kosong!' };
      updatePayload.default_urgensi = cleanUrgensi;
    }
    if (data.deskripsi_sop !== undefined) {
      updatePayload.deskripsi_sop = data.deskripsi_sop?.trim();
    }
    if (data.display_order !== undefined) {
      updatePayload.display_order = Number(data.display_order) || 1;
    }
    if (data.is_active !== undefined) {
      updatePayload.is_active = Boolean(data.is_active);
    }

    const updated = await prisma.masterIncidentSubcategory.update({
      where: { id: idCheck.value },
      data: updatePayload,
    });

    await auditLog('UPDATE_INCIDENT_SUBCATEGORY', `Memperbarui sub-kategori kasus ID ${idCheck.value}: ${updated.nama_kasus}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMasterIncidentSubcategoryAction(id: number | string) {
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
  try {
    const idCheck = parsePositiveIntId(id, 'ID Subkategori Kasus');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const deleted = await prisma.masterIncidentSubcategory.delete({
      where: { id: idCheck.value },
    });
    await auditLog('DELETE_INCIDENT_SUBCATEGORY', `Menghapus sub-kategori kasus ID ${idCheck.value}: ${deleted.nama_kasus}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 3. MASTER TINGKAT URGENSI PRESISI (master_urgency_levels)
// ==============================================================================
export async function getMasterUrgencyLevelsAction() {
  try {
    const rows = await prisma.masterUrgencyLevel.findMany({
      where: { is_active: true },
      orderBy: { display_order: 'asc' },
    });
    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 4. MASTER LOKASI PENYELESAIAN KASUS (master_resolution_location_types)
// ==============================================================================
export async function getMasterResolutionLocationsAction(params?: {
  search?: string;
  isActive?: boolean;
}) {
  try {
    const where: any = {};
    if (params?.isActive !== undefined) {
      where.is_active = params.isActive;
    }
    if (params?.search) {
      const q = params.search.trim();
      where.OR = [
        { key: { contains: q } },
        { label: { contains: q } },
        { keterangan: { contains: q } },
      ];
    }

    const rows = await prisma.masterResolutionLocationType.findMany({
      where,
      orderBy: { display_order: 'asc' },
    });
    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMasterResolutionLocationAction(data: {
  key: string;
  label: string;
  keterangan?: string;
  requires_strict_tkp?: boolean;
  display_order?: number;
  is_active?: boolean;
}) {
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
  try {
    const key = data.key?.trim().toUpperCase();
    const label = data.label?.trim();
    if (!key || !label) {
      return { success: false, error: 'Key (Kode) dan Label Lokasi wajib diisi!' };
    }

    const existing = await prisma.masterResolutionLocationType.findUnique({
      where: { key },
    });
    if (existing) {
      return { success: false, error: `Kode lokasi "${key}" sudah terdaftar!` };
    }

    const created = await prisma.masterResolutionLocationType.create({
      data: {
        key,
        label,
        keterangan: data.keterangan?.trim() || null,
        requires_strict_tkp: Boolean(data.requires_strict_tkp),
        display_order: Number(data.display_order) || 1,
        is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      },
    });

    await auditLog('CREATE_RESOLUTION_LOCATION', `Menambahkan master lokasi penyelesaian: ${key} - ${label}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(created) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateMasterResolutionLocationAction(
  id: number | string,
  data: {
    key?: string;
    label?: string;
    keterangan?: string;
    requires_strict_tkp?: boolean;
    display_order?: number;
    is_active?: boolean;
  }
) {
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
  try {
    const idCheck = parsePositiveIntId(id, 'ID Master Lokasi');
    if (!idCheck.valid) return { success: false, error: idCheck.error };

    const updateData: any = {};
    if (data.key !== undefined) updateData.key = data.key.trim().toUpperCase();
    if (data.label !== undefined) updateData.label = data.label.trim();
    if (data.keterangan !== undefined) updateData.keterangan = data.keterangan.trim() || null;
    if (data.requires_strict_tkp !== undefined) updateData.requires_strict_tkp = Boolean(data.requires_strict_tkp);
    if (data.display_order !== undefined) updateData.display_order = Number(data.display_order);
    if (data.is_active !== undefined) updateData.is_active = Boolean(data.is_active);

    const updated = await prisma.masterResolutionLocationType.update({
      where: { id: idCheck.value },
      data: updateData,
    });

    await auditLog('UPDATE_RESOLUTION_LOCATION', `Memperbarui master lokasi penyelesaian ID ${idCheck.value}: ${updated.key}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMasterResolutionLocationAction(id: number | string) {
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
  try {
    const idCheck = parsePositiveIntId(id, 'ID Master Lokasi');
    if (!idCheck.valid) return { success: false, error: idCheck.error };

    const deleted = await prisma.masterResolutionLocationType.delete({
      where: { id: idCheck.value },
    });

    await auditLog('DELETE_RESOLUTION_LOCATION', `Menghapus master lokasi penyelesaian ID ${idCheck.value}: ${deleted.key}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 5. MASTER OBJEK DOKUMEN / BUKTI BAP PENYELESAIAN (master_resolution_document_types)
// ==============================================================================
export async function getMasterResolutionDocumentsAction(params?: {
  search?: string;
  isActive?: boolean;
}) {
  try {
    const where: any = {};
    if (params?.isActive !== undefined) {
      where.is_active = params.isActive;
    }
    if (params?.search) {
      const q = params.search.trim();
      where.OR = [
        { key: { contains: q } },
        { label: { contains: q } },
        { keterangan: { contains: q } },
      ];
    }

    const rows = await prisma.masterResolutionDocumentType.findMany({
      where,
      orderBy: { display_order: 'asc' },
    });
    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMasterResolutionDocumentAction(data: {
  key: string;
  label: string;
  keterangan?: string;
  display_order?: number;
  is_active?: boolean;
}) {
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
  try {
    const key = data.key?.trim().toUpperCase();
    const label = data.label?.trim();
    if (!key || !label) {
      return { success: false, error: 'Key (Kode) dan Label Dokumen wajib diisi!' };
    }

    const existing = await prisma.masterResolutionDocumentType.findUnique({
      where: { key },
    });
    if (existing) {
      return { success: false, error: `Kode dokumen "${key}" sudah terdaftar!` };
    }

    const created = await prisma.masterResolutionDocumentType.create({
      data: {
        key,
        label,
        keterangan: data.keterangan?.trim() || null,
        display_order: Number(data.display_order) || 1,
        is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      },
    });

    await auditLog('CREATE_RESOLUTION_DOCUMENT', `Menambahkan master dokumen penyelesaian: ${key} - ${label}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(created) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateMasterResolutionDocumentAction(
  id: number | string,
  data: {
    key?: string;
    label?: string;
    keterangan?: string;
    display_order?: number;
    is_active?: boolean;
  }
) {
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
  try {
    const idCheck = parsePositiveIntId(id, 'ID Master Dokumen');
    if (!idCheck.valid) return { success: false, error: idCheck.error };

    const updateData: any = {};
    if (data.key !== undefined) updateData.key = data.key.trim().toUpperCase();
    if (data.label !== undefined) updateData.label = data.label.trim();
    if (data.keterangan !== undefined) updateData.keterangan = data.keterangan.trim() || null;
    if (data.display_order !== undefined) updateData.display_order = Number(data.display_order);
    if (data.is_active !== undefined) updateData.is_active = Boolean(data.is_active);

    const updated = await prisma.masterResolutionDocumentType.update({
      where: { id: idCheck.value },
      data: updateData,
    });

    await auditLog('UPDATE_RESOLUTION_DOCUMENT', `Memperbarui master dokumen penyelesaian ID ${idCheck.value}: ${updated.key}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMasterResolutionDocumentAction(id: number | string) {
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
  try {
    const idCheck = parsePositiveIntId(id, 'ID Master Dokumen');
    if (!idCheck.valid) return { success: false, error: idCheck.error };

    const deleted = await prisma.masterResolutionDocumentType.delete({
      where: { id: idCheck.value },
    });

    await auditLog('DELETE_RESOLUTION_DOCUMENT', `Menghapus master dokumen penyelesaian ID ${idCheck.value}: ${deleted.key}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
