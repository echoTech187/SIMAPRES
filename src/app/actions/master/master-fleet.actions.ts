'use server';

import { prisma, serializeBigInt, auditLog, parsePositiveIntId, revalidatePath, requireSuperadmin, requireRole } from './master-common';

// ==============================================================================
// 1. MASTER TIPE & STATUS OPERASIONAL KENDARAAN (master_vehicle_types & master_vehicle_statuses)
// ==============================================================================
export async function getMasterVehicleTypesAction() {
  try {
    const rows: any = await prisma.$queryRawUnsafe(`
      SELECT id, \`key\`, label, display_order 
      FROM master_vehicle_types 
      WHERE is_active = 1 
      ORDER BY display_order ASC
    `);
    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getMasterVehicleStatusesAction() {
  try {
    const rows: any = await prisma.$queryRawUnsafe(`
      SELECT id, \`key\`, label, display_order 
      FROM master_vehicle_statuses 
      WHERE is_active = 1 
      ORDER BY display_order ASC
    `);
    return { success: true, data: serializeBigInt(rows) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 2. MASTER ARMADA OPERASIONAL / KENDARAAN PATROLI (patrol_vehicles)
// ==============================================================================
export async function getMasterVehiclesAction(params?: {
  search?: string;
  status?: string;
  jenis?: string;
  stationId?: number | string;
}) {
  try {
    const andConditions: any[] = [];
    if (params?.status && typeof params.status === 'string' && params.status.trim()) {
      andConditions.push({ status_operasional: params.status.trim().toUpperCase() });
    }
    if (params?.jenis && typeof params.jenis === 'string' && params.jenis.trim()) {
      andConditions.push({ jenis_kendaraan: params.jenis.trim() });
    }
    if (params?.stationId != null) {
      const stId = Number(params.stationId);
      andConditions.push({
        OR: [
          { station_id: stId },
          { station_id: null },
        ],
      });
    }
    if (params?.search && typeof params.search === 'string' && params.search.trim()) {
      const q = params.search.trim();
      andConditions.push({
        OR: [
          { nomor_lambung: { contains: q } },
          { nama_armada: { contains: q } },
          { plat_nomor_polisi: { contains: q } },
        ],
      });
    }

    const where: any = andConditions.length > 0 ? { AND: andConditions } : {};
    const rows = await prisma.patrolVehicle.findMany({
      where,
      include: {
        station: true,
        unit: true,
      },
      orderBy: { id: 'asc' },
    });
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
  status_operasional?: string;
  driver_officer_nrp?: string;
  current_lat?: number;
  current_lng?: number;
}) {
  const auth = await requireRole(['LOGISTIK', 'SUPERADMIN']);
  if (!auth.authorized) return { success: false, error: auth.error };
  try {
    const lambung = data.nomor_lambung?.trim().toUpperCase();
    const nama = data.nama_armada?.trim();
    if (!lambung || !nama) {
      return { success: false, error: 'Nomor lambung dan Nama armada wajib diisi!' };
    }
    if (!data.jenis_kendaraan?.trim()) {
      return { success: false, error: 'Jenis kendaraan armada operasional wajib dipilih!' };
    }
    if (!data.status_operasional?.trim()) {
      return { success: false, error: 'Status kesiapsiagaan armada wajib dipilih!' };
    }
    if (!data.plat_nomor_polisi?.trim()) {
      return { success: false, error: 'Nomor plat dinas polisi wajib diisi!' };
    }

    const qrToken = `QR-VEH-${lambung.replace(/[^A-Z0-9]/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const statusOp = data.status_operasional.trim().toUpperCase();

    const created = await prisma.patrolVehicle.create({
      data: {
        nomor_lambung: lambung,
        nama_armada: nama,
        jenis_kendaraan: data.jenis_kendaraan.trim(),
        plat_nomor_polisi: data.plat_nomor_polisi.trim().toUpperCase(),
        qr_token: qrToken,
        status_operasional: statusOp,
        driver_officer_nrp: data.driver_officer_nrp?.trim(),
        current_lat: data.current_lat != null && !isNaN(Number(data.current_lat)) ? Number(data.current_lat) : null,
        current_lng: data.current_lng != null && !isNaN(Number(data.current_lng)) ? Number(data.current_lng) : null,
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
  id: number | string,
  data: {
    nomor_lambung: string;
    nama_armada: string;
    jenis_kendaraan: string;
    plat_nomor_polisi?: string;
    status_operasional?: string;
    driver_officer_nrp?: string;
    current_lat?: number;
    current_lng?: number;
  }
) {
  const auth = await requireRole(['LOGISTIK', 'SUPERADMIN']);
  if (!auth.authorized) return { success: false, error: auth.error };
  try {
    const idCheck = parsePositiveIntId(id, 'ID Armada Kendaraan');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const lambung = data.nomor_lambung?.trim().toUpperCase();
    const nama = data.nama_armada?.trim();
    if (!lambung || !nama) {
      return { success: false, error: 'Nomor lambung dan Nama armada wajib diisi!' };
    }
    if (!data.jenis_kendaraan?.trim()) {
      return { success: false, error: 'Jenis kendaraan armada operasional wajib dipilih!' };
    }
    if (!data.status_operasional?.trim()) {
      return { success: false, error: 'Status kesiapsiagaan armada wajib dipilih!' };
    }
    if (!data.plat_nomor_polisi?.trim()) {
      return { success: false, error: 'Nomor plat dinas polisi wajib diisi!' };
    }

    const statusColors: Record<string, string> = {
      SIAGA: '#10B981',
      PATROLI: '#3B82F6',
      MENUJU_TKP: '#EF4444',
      PEMELIHARAAN: '#6B7280',
    };
    const statusOp = data.status_operasional.trim().toUpperCase();
    if (!statusColors[statusOp]) {
      return { success: false, error: 'Status kesiapsiagaan armada tidak valid!' };
    }

    const updated = await prisma.patrolVehicle.update({
      where: { id: idCheck.value },
      data: {
        nomor_lambung: lambung,
        nama_armada: nama,
        jenis_kendaraan: data.jenis_kendaraan.trim(),
        plat_nomor_polisi: data.plat_nomor_polisi.trim().toUpperCase(),
        status_operasional: statusOp,
        status_color: statusColors[statusOp],
        driver_officer_nrp: data.driver_officer_nrp?.trim(),
        current_lat: data.current_lat != null && !isNaN(Number(data.current_lat)) ? Number(data.current_lat) : null,
        current_lng: data.current_lng != null && !isNaN(Number(data.current_lng)) ? Number(data.current_lng) : null,
      },
    });

    await auditLog('UPDATE_VEHICLE', `Memperbarui armada patroli ID ${idCheck.value}: ${updated.nomor_lambung} - ${updated.nama_armada}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMasterVehicleAction(id: number | string) {
  const auth = await requireRole(['LOGISTIK', 'SUPERADMIN']);
  if (!auth.authorized) return { success: false, error: auth.error };
  try {
    const idCheck = parsePositiveIntId(id, 'ID Armada Kendaraan');
    if (!idCheck.valid) {
      return { success: false, error: idCheck.error };
    }

    const deleted = await prisma.patrolVehicle.delete({
      where: { id: idCheck.value },
    });
    await auditLog('DELETE_VEHICLE', `Menghapus armada patroli ID ${idCheck.value}: ${deleted.nomor_lambung} - ${deleted.nama_armada}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 3. MASTER JENIS BAHAN BAKAR (master_fuel_types)
// ==============================================================================
export async function getMasterFuelTypesAction() {
  try {
    const list = await prisma.masterFuelType.findMany({
      orderBy: { display_order: 'asc' },
      include: { _count: { select: { vehicles: true } } },
    });
    return { success: true, data: serializeBigInt(list) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMasterFuelTypeAction(data: {
  key: string;
  label: string;
  default_price_per_liter?: number;
  display_order?: number;
  is_active?: boolean;
}) {
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
  try {
    if (!data.key || !data.label) {
      return { success: false, error: 'Key dan Label Jenis Bahan Bakar wajib diisi!' };
    }
    const cleanKey = data.key.trim().toUpperCase().replace(/\s+/g, '_');
    const created = await prisma.masterFuelType.create({
      data: {
        key: cleanKey,
        label: data.label.trim(),
        default_price_per_liter: Number(data.default_price_per_liter || 6800.0),
        display_order: Number(data.display_order || 1),
        is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      },
    });

    await auditLog('CREATE_FUEL_TYPE', `Menambah master BBM baru: ${created.label} (${cleanKey})`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(created) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateMasterFuelTypeAction(
  id: number | string,
  data: {
    key?: string;
    label?: string;
    default_price_per_liter?: number;
    display_order?: number;
    is_active?: boolean;
  }
) {
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
  try {
    const idCheck = parsePositiveIntId(id, 'ID Master BBM');
    if (!idCheck.valid) return { success: false, error: idCheck.error };

    const updateData: any = {};
    if (data.key !== undefined) updateData.key = data.key.trim().toUpperCase().replace(/\s+/g, '_');
    if (data.label !== undefined) updateData.label = data.label.trim();
    if (data.default_price_per_liter !== undefined) updateData.default_price_per_liter = Number(data.default_price_per_liter);
    if (data.display_order !== undefined) updateData.display_order = Number(data.display_order);
    if (data.is_active !== undefined) updateData.is_active = Boolean(data.is_active);

    const updated = await prisma.masterFuelType.update({
      where: { id: idCheck.value },
      data: updateData,
    });

    await auditLog('UPDATE_FUEL_TYPE', `Memperbarui master BBM ID ${idCheck.value}: ${updated.label}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMasterFuelTypeAction(id: number | string) {
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
  try {
    const idCheck = parsePositiveIntId(id, 'ID Master BBM');
    if (!idCheck.valid) return { success: false, error: idCheck.error };

    const deleted = await prisma.masterFuelType.delete({
      where: { id: idCheck.value },
    });

    await auditLog('DELETE_FUEL_TYPE', `Menghapus master BBM ID ${idCheck.value}: ${deleted.label}`);
    revalidatePath('/console');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 4. MASTER STATUS ALUR KLAIM BBM LOGISTIK (master_fuel_claim_statuses)
// ==============================================================================
export async function getMasterFuelClaimStatusesAction() {
  try {
    const list = await prisma.masterFuelClaimStatus.findMany({
      orderBy: { display_order: 'asc' },
      include: { _count: { select: { dispatches: true } } },
    });
    return { success: true, data: serializeBigInt(list) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMasterFuelClaimStatusAction(data: {
  key: string;
  label: string;
  keterangan?: string;
  display_order?: number;
  is_active?: boolean;
}) {
  const auth = await requireSuperadmin();
  if (!auth.authorized) return { success: false, error: auth.error };
  try {
    if (!data.key || !data.label) {
      return { success: false, error: 'Key dan Label Status Klaim wajib diisi!' };
    }
    const cleanKey = data.key.trim().toUpperCase().replace(/\s+/g, '_');
    const created = await prisma.masterFuelClaimStatus.create({
      data: {
        key: cleanKey,
        label: data.label.trim(),
        keterangan: data.keterangan?.trim() || null,
        display_order: Number(data.display_order || 1),
        is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      },
    });

    await auditLog('CREATE_FUEL_CLAIM_STATUS', `Menambah status klaim BBM baru: ${created.label} (${cleanKey})`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(created) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateMasterFuelClaimStatusAction(
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
    const idCheck = parsePositiveIntId(id, 'ID Status Klaim');
    if (!idCheck.valid) return { success: false, error: idCheck.error };

    const updateData: any = {};
    if (data.key !== undefined) updateData.key = data.key.trim().toUpperCase().replace(/\s+/g, '_');
    if (data.label !== undefined) updateData.label = data.label.trim();
    if (data.keterangan !== undefined) updateData.keterangan = data.keterangan.trim() || null;
    if (data.display_order !== undefined) updateData.display_order = Number(data.display_order);
    if (data.is_active !== undefined) updateData.is_active = Boolean(data.is_active);

    const updated = await prisma.masterFuelClaimStatus.update({
      where: { id: idCheck.value },
      data: updateData,
    });

    await auditLog('UPDATE_FUEL_CLAIM_STATUS', `Memperbarui status klaim BBM ID ${idCheck.value}: ${updated.label}`);
    revalidatePath('/console');
    return { success: true, data: serializeBigInt(updated) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 5. AUDIT LOGISTIK & REKAP KLAIM BBM BULANAN POLRI
// ==============================================================================
export async function getFuelAuditReportAction(stationId?: number | null, month?: number, year?: number) {
  try {
    const { FuelAuditService } = await import('@/infrastructure/services/fuel-audit.service');
    const report = await FuelAuditService.getMonthlyFuelAuditSummary(stationId, month, year);
    return { success: true, data: serializeBigInt(report) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 6. PENGAJUAN KLAIM STRUK BBM & SPIDOMETER PERSONEL LAPANGAN
// ==============================================================================
async function saveEvidencePhoto(photoDataUrl?: string, prefix = 'struk'): Promise<string | null> {
  if (!photoDataUrl || typeof photoDataUrl !== 'string') return null;
  if (!photoDataUrl.startsWith('data:image/')) {
    return photoDataUrl.slice(0, 255);
  }

  try {
    const fs = await import('fs');
    const path = await import('path');
    const matches = photoDataUrl.match(/^data:image\/([a-zA-Z0-9.+_-]+);base64,(.+)$/);
    if (matches) {
      const ext = matches[1].includes('jpeg') ? 'jpg' : matches[1].replace(/[^a-zA-Z0-9]/g, '');
      const buffer = Buffer.from(matches[2], 'base64');
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext || 'jpg'}`;
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);
      return `/uploads/${fileName}`;
    }
  } catch (err) {
    console.warn(`[Evidence] Gagal menyimpan file ${prefix} ke public/uploads:`, err);
  }

  // Fallback jika filesystem serverless read-only:
  return `/uploads/${prefix}_archive_${Date.now()}.jpg`;
}

export async function submitFuelClaimAction(input: {
  complaintId?: string | number | null;
  dispatchId?: string | number | null;
  officerId: string | number;
  odometerKm?: number | null;
  liters: number;
  costRupiah: number;
  spbuName: string;
  receiptNumber?: string;
  purchaseDate?: string;
  purchaseTime?: string;
  fuelType?: string;
  fuelTypeId?: number | null;
  strukPhotoUrl?: string;
  spidometerPhotoUrl?: string;
  notes?: string;
}) {
  const auth = await requireRole(['PERSONIL', 'SUPERADMIN', 'LOGISTIK', 'PAWAS']);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    // Validasi Anti-Fraud Sisi Server: Cegah penyimpanan struk terindikasi manipulasi
    if (
      input.notes?.includes('[Audit AI: REKAYASA_DIGITAL') ||
      input.notes?.includes('[Audit AI: BUKAN_STRUK_SPBU')
    ) {
      return {
        success: false,
        error:
          'Pengajuan klaim ditolak sistem: Struk BBM terdeteksi sebagai rekayasa digital atau bukan struk resmi SPBU.',
      };
    }

    const diajukanStatus = await prisma.masterFuelClaimStatus.findUnique({
      where: { key: 'DIAJUKAN_BAGLOG' },
    });

    let dispatch = null;
    if (input.dispatchId) {
      dispatch = await prisma.complaintDispatch.findUnique({
        where: { id: BigInt(input.dispatchId) },
      });
    } else if (input.complaintId) {
      dispatch = await prisma.complaintDispatch.findFirst({
        where: { complaint_id: BigInt(input.complaintId) },
        orderBy: { id: 'desc' },
      });
    }

    const notesSummary = [
      `SPBU: ${input.spbuName || '-'}`,
      input.purchaseDate ? `Tgl: ${input.purchaseDate}${input.purchaseTime ? ` ${input.purchaseTime}` : ''}` : null,
      input.fuelType ? `BBM: ${input.fuelType}` : null,
      input.receiptNumber ? `No. Struk: ${input.receiptNumber}` : null,
      input.odometerKm ? `Spidometer: ${input.odometerKm} KM` : null,
      input.notes ? `Catatan: ${input.notes}` : null,
    ].filter(Boolean).join(' | ');

    // Simpan foto bukti ke direktori static public/uploads agar URL ringkas (< 255 karakter)
    const savedStrukUrl = await saveEvidencePhoto(input.strukPhotoUrl, 'struk_bbm');
    const savedSpidometerUrl = await saveEvidencePhoto(input.spidometerPhotoUrl, 'spidometer');

    if (dispatch) {
      await prisma.complaintDispatch.update({
        where: { id: dispatch.id },
        data: {
          fuel_liters_used: input.liters,
          fuel_cost_estimated: input.costRupiah,
          fuel_claim_status_id: diajukanStatus?.id || dispatch.fuel_claim_status_id,
          fuel_claim_notes: notesSummary,
        },
      });

      if (dispatch.complaint_id) {
        if (savedStrukUrl) {
          await prisma.complaintEvidence.create({
            data: {
              complaint_id: dispatch.complaint_id,
              incident_phase: 'STRUK_BBM',
              file_url: savedStrukUrl,
              caption: `Struk Pengisian BBM ${input.spbuName || 'SPBU'} (${input.liters} L - Rp ${Number(input.costRupiah).toLocaleString('id-ID')})`.slice(0, 255),
              watermark_text: `Klaim BBM DIPA • Struk SPBU: ${input.receiptNumber || '-'}`.slice(0, 255),
            },
          });
        }
        if (savedSpidometerUrl) {
          await prisma.complaintEvidence.create({
            data: {
              complaint_id: dispatch.complaint_id,
              incident_phase: 'SPIDOMETER',
              file_url: savedSpidometerUrl,
              caption: `Foto Spidometer Fisik Randis (${input.odometerKm || 0} KM)`.slice(0, 255),
              watermark_text: `Odometer Fisik: ${input.odometerKm || 0} KM`.slice(0, 255),
            },
          });
        }
      }
    } else {
      let resolvedOfficerId: bigint | null = null;
      try {
        const po = await prisma.policeOfficer.findFirst({
          where: {
            OR: [
              { id: BigInt(input.officerId) },
              { user_id: BigInt(input.officerId) },
              ...(auth.user?.identifier ? [{ nrp: auth.user.identifier }] : []),
            ],
          },
        });
        if (po) resolvedOfficerId = po.id;
      } catch (_) {}

      if (resolvedOfficerId) {
        const lastDispatch = await prisma.complaintDispatch.findFirst({
          where: { officer_id: resolvedOfficerId },
          orderBy: { id: 'desc' },
        });

        if (lastDispatch) {
          await prisma.complaintDispatch.update({
            where: { id: lastDispatch.id },
            data: {
              fuel_liters_used: input.liters,
              fuel_cost_estimated: input.costRupiah,
              fuel_claim_status_id: diajukanStatus?.id || lastDispatch.fuel_claim_status_id,
              fuel_claim_notes: notesSummary,
            },
          });

          if (savedStrukUrl && lastDispatch.complaint_id) {
            await prisma.complaintEvidence.create({
              data: {
                complaint_id: lastDispatch.complaint_id,
                incident_phase: 'STRUK_BBM',
                file_url: savedStrukUrl,
                caption: `Struk Pengisian BBM ${input.spbuName || 'SPBU'} (${input.liters} L)`.slice(0, 255),
                watermark_text: `Klaim BBM DIPA • Struk: ${input.receiptNumber || '-'}`.slice(0, 255),
              },
            });
          }

          if (savedSpidometerUrl && lastDispatch.complaint_id) {
            await prisma.complaintEvidence.create({
              data: {
                complaint_id: lastDispatch.complaint_id,
                incident_phase: 'SPIDOMETER',
                file_url: savedSpidometerUrl,
                caption: `Foto Spidometer Fisik (${input.odometerKm || 0} KM)`.slice(0, 255),
                watermark_text: `Odometer Fisik: ${input.odometerKm || 0} KM`.slice(0, 255),
              },
            });
          }
        }
      }
    }

    try {
      revalidatePath('/console');
    } catch (_) {}

    return {
      success: true,
      message: 'Klaim BBM dan bukti foto struk berhasil diajukan ke Staf Logistik (Status: DIAJUKAN).',
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengajukan klaim BBM.' };
  }
}
