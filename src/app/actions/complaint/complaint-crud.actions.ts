'use server';

import { UseCaseFactory } from '@/application/factories/use-case.factory';
import { UrgensiLevel } from '@/domain/entities/complaint.entity';
import { ComplaintNotificationDispatcher } from '@/application/services/complaint-notification.service';
import { reverseGeocodeCoords, isGenericOrCoordinateAddress } from '@/infrastructure/services/reverse-geocode.service';
import { requireRole } from '@/lib/session';
import {
  prisma,
  safeRevalidatePath,
  serializeBigInt,
  CreateComplaintActionInput,
  normalizeCreateComplaintInput,
} from './complaint-common';
import { getActiveSpktDutyOfficerPhone } from './complaint-query.actions';
import {
  consumeRateLimit,
  getClientIp,
  RATE_LIMIT_CONFIG,
} from '@/infrastructure/security/rate-limiter';
import { validateBase64ImagePayload } from '@/infrastructure/security/file-security.service';

export async function createComplaintAction(input: CreateComplaintActionInput) {
  try {
    const {
      cleanNama,
      cleanHp,
      cleanJenis,
      cleanAlamat,
      cleanRingkasan,
      platformKey,
      initialFoto,
      kategoriKey,
    } = normalizeCreateComplaintInput(input);

    if (!cleanNama || cleanNama === '-') {
      return { success: false, error: 'Nama pelapor wajib diisi!' };
    }

    if (!cleanHp || cleanHp === '-') {
      return { success: false, error: 'Nomor telepon / kontak pelapor wajib diisi!' };
    }

    if (!cleanJenis || cleanJenis === '-') {
      return { success: false, error: 'Kategori / jenis kejadian laporan wajib dipilih!' };
    }

    if (!cleanAlamat || cleanAlamat === '-') {
      return { success: false, error: 'Alamat tempat kejadian perkara (TKP) wajib diisi!' };
    }

    if (
      input.tkpLat === undefined ||
      input.tkpLat === null ||
      isNaN(Number(input.tkpLat)) ||
      input.tkpLng === undefined ||
      input.tkpLng === null ||
      isNaN(Number(input.tkpLng))
    ) {
      return { success: false, error: 'Koordinat lokasi TKP (latitude & longitude) wajib diisi angka valid!' };
    }

    if (!cleanRingkasan || cleanRingkasan === '-') {
      return { success: false, error: 'Uraian ringkasan kejadian wajib diisi!' };
    }

    // Rate Limiting: Mencegah spam pembuatan laporan darurat massal
    const clientIp = await getClientIp();
    const rateLimitKey = `complaint_submit:${cleanHp || clientIp}`;
    const rateCheck = consumeRateLimit(
      rateLimitKey,
      RATE_LIMIT_CONFIG.CITIZEN_COMPLAINT.maxAttempts,
      RATE_LIMIT_CONFIG.CITIZEN_COMPLAINT.windowMs
    );

    if (!rateCheck.allowed) {
      return {
        success: false,
        error: `Batas pengiriman laporan tercapai. Mohon tunggu ${rateCheck.retryAfterSec} detik sebelum membuat laporan baru demi ketertiban antrean darurat.`,
      };
    }

    let finalAlamat = cleanAlamat;
    if (isGenericOrCoordinateAddress(finalAlamat) && input.tkpLat && input.tkpLng) {
      try {
        const resolved = await reverseGeocodeCoords(Number(input.tkpLat), Number(input.tkpLng));
        if (resolved && !isGenericOrCoordinateAddress(resolved)) {
          finalAlamat = resolved;
        }
      } catch (_) {}
    }

    // Validasi Integritas Foto Bukti Pelapor (Maksimal 5MB, Magic Bytes, Format Sah)
    if (initialFoto) {
      const vFoto = validateBase64ImagePayload(initialFoto);
      if (!vFoto.valid) {
        return { success: false, error: 'Foto lampiran bukti tidak valid: ' + vFoto.error };
      }
    }

    const useCase = UseCaseFactory.getCreateComplaintUseCase();
    const result = await useCase.execute({
      pelaporNama: cleanNama,
      pelaporHp: cleanHp,
      jenisKejadian: cleanJenis,
      urgensi: input.urgensi as UrgensiLevel,
      tkpAlamatTeks: finalAlamat,
      tkpLat: Number(input.tkpLat),
      tkpLng: Number(input.tkpLng),
      ringkasanKeterangan: cleanRingkasan,
      operatorId: input.operatorId ? BigInt(input.operatorId) : null,
      kategoriKey,
      subcategoryId: input.subcategoryId ? Number(input.subcategoryId) : null,
      platformKey,
      fotoBuktiUrl: initialFoto,
      nomorTiket: input.nomorTiket?.trim(),
    });
    safeRevalidatePath();
    const { generateTrackingToken } = await import('@/lib/tracking-token');
    const token = generateTrackingToken(result.nomorTiket);
    const serialized = serializeBigInt(result.toJSON());

    // Otomatis kirim notifikasi WhatsApp resmi ke nomor pelapor via Domain Policy (non-blocking)
    ComplaintNotificationDispatcher.dispatchAsync(result.id, 'TICKET_CREATED', {
      nomorTiket: result.nomorTiket,
      pelaporNama: cleanNama,
      pelaporHp: cleanHp,
      jenisKejadian: cleanJenis,
      tkpAlamatTeks: cleanAlamat,
    });

    return { success: true, data: { ...serialized, trackingToken: token } };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal membuat pengaduan.' };
  }
}

export async function createComplaintAndBroadcastAction(input: CreateComplaintActionInput): Promise<{
  success: boolean;
  error?: string;
  data?: any;
}> {
  const auth = await requireRole(['OPERATOR', 'PAWAS', 'SUPERADMIN']);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const createRes = await createComplaintAction(input);
  if (!createRes.success || !createRes.data) {
    return { success: false, error: createRes.error };
  }

  const complaintData = createRes.data;
  if (!complaintData.id) {
    return { success: false, error: 'ID tiket tidak terbentuk.' };
  }
  const complaintIdBig = BigInt(complaintData.id);

  try {
    // proxy via IComplaintRepository

    // 1. Ambil seluruh master unit operasional aktif
    const operationalUnits = await prisma.masterOperationalUnit.findMany({
      where: { is_active: true },
    });
    const satuans = operationalUnits.length > 0 ? operationalUnits : [{ id: 1, default_orders: 'Laksanakan respon cepat ke TKP' }];

    // 2. Filter Berbasis Wilayah (Geo-Targeting): Resolusi Polsek Sektor Wilayah TKP
    const allStationsRaw: any[] = await prisma.policeStation.findMany();
    const allStations = allStationsRaw.filter((st) => st.is_active !== false);

    // Resolusi Mako Asal Operator (Home Station)
    const operatorStationId = auth.user?.stationId ? Number(auth.user.stationId) : null;
    const homeStation = (operatorStationId ? allStations.find((s) => s.id === operatorStationId) : null) ||
      allStations.find((s) => (s.station_code || '').includes('PEKALONGAN') || (s.station_name || '').toLowerCase().includes('pekalongan')) ||
      allStations[0];

    // Evaluasi Batas Yurisdiksi (E-Routing Boundary)
    const { evaluateJurisdictionBoundary } = await import('@/lib/jurisdiction-boundary');
    const boundaryCheck = evaluateJurisdictionBoundary({
      tkpLat: Number(input.tkpLat),
      tkpLng: Number(input.tkpLng),
      tkpAlamat: input.tkpAlamatTeks,
      currentStationId: homeStation?.id || 60001,
      currentStationName: homeStation?.station_name || 'Polres Pekalongan',
      stations: allStations.map((st: any) => ({
        id: st.id,
        stationCode: st.station_code,
        stationName: st.station_name,
        officeLat: st.office_lat,
        officeLng: st.office_lng,
      })),
    });

    const isOutsideJurisdiction = boundaryCheck.isOutsideJurisdiction;

    const { resolveSektorWilayah } = await import('@/infrastructure/services/reverse-geocode.service');
    const resolvedSektor = resolveSektorWilayah(input.tkpAlamatTeks);
    const resolvedLower = resolvedSektor.toLowerCase();

    let targetStation: any = null;

    if (isOutsideJurisdiction) {
      // ATURAN KRUSIAL USER: Jika titik TKP terindikasi di luar yurisdiksi mako asal (misal terdeteksi di Batang),
      // tiket JANGAN dialihkan dulu ke Mako tetangga sebelum operator mengklik tombol 'Disposisi Lintas Wilayah'!
      // Tiket tetap menginduk pada Mako asal operator (homeStation) dengan status MENUNGGU.
      targetStation = homeStation;
    } else {
      targetStation = allStations.find((st: any) => {
        const sName = (st.station_name || '').toLowerCase();
        return resolvedLower.includes(sName) || (input.tkpAlamatTeks && input.tkpAlamatTeks.toLowerCase().includes(sName));
      });

      // Fallback ke Haversine jarak terdekat jika koordinat valid
      if (!targetStation && input.tkpLat && input.tkpLng && allStations.length > 0) {
        const { HaversineService } = await import('@/infrastructure/services/haversine.service');
        let minDistance = Infinity;
        for (const st of allStations) {
          const d = HaversineService.calculateDistanceKm(
            Number(input.tkpLat),
            Number(input.tkpLng),
            Number(st.office_lat),
            Number(st.office_lng)
          );
          if (d < minDistance) {
            minDistance = d;
            targetStation = st;
          }
        }
      }
    }

    // 3. Filter Tingkat Urgensi: Hitung Batas Waktu Eskalasi (Safety Net Timer)
    const urgensi = (input.urgensi || 'SEDANG').toUpperCase();
    const isDarurat = urgensi === 'DARURAT';
    const isSedang = urgensi === 'SEDANG';
    const deadlineMinutes = isDarurat ? 3 : isSedang ? 5 : null;
    const escalationDeadline = deadlineMinutes ? new Date(Date.now() + deadlineMinutes * 60 * 1000) : null;

    // Ambil Master Dispatch Mode & Fuel Claim Status dari database (Anti-Hardcode)
    const defaultDispatchMode = await prisma.masterDispatchMode.findUnique({
      where: { key: 'UNIT_PIKET_POLSEK' },
    });
    const defaultClaimStatus = await prisma.masterFuelClaimStatus.findUnique({
      where: { key: 'UNCLAIMED' },
    });

    // 3.B: Kalkulasi estimasi mileage & konsumsi BBM berdasarkan database master
    let fuelAuditEst: any = null;
    if (targetStation?.office_lat && targetStation?.office_lng && input.tkpLat && input.tkpLng) {
      try {
        const { FuelAuditService } = await import('@/infrastructure/services/fuel-audit.service');
        fuelAuditEst = await FuelAuditService.calculateDispatchFuelUsage(
          Number(targetStation.office_lat),
          Number(targetStation.office_lng),
          Number(input.tkpLat),
          Number(input.tkpLng)
        );
      } catch (fErr) {
        console.warn('[FuelAuditService Calc Error]:', fErr);
      }
    }

    await prisma.$transaction(async (tx) => {
      // Hubungkan station_id jika ditemukan, status complaint tetap MENUNGGU (Tahap 1: Disiarkan ke Armada)
      // Status baru berubah menjadi DIPROSES (Tahap 2) saat ada personel yang mengklik Terima/Ambil Tugas
      await tx.complaint.update({
        where: { id: complaintIdBig },
        data: {
          status: 'MENUNGGU',
          status_id: 1,
          tahap: 1,
          ...(targetStation ? { station_id: targetStation.id } : {}),
        },
      });

      // Buat rekaman broadcast dispatch untuk setiap satuan operasional
      for (let i = 0; i < satuans.length; i++) {
        const s = satuans[i];
        await (tx as any).complaintDispatch.create({
          data: {
            complaint_id: complaintIdBig,
            unit_id: s.id,
            officer_id: null,
            station_id: targetStation ? targetStation.id : null,
            dispatch_mode_id: defaultDispatchMode ? defaultDispatchMode.id : null,
            is_primary_unit: i === 0,
            personnel_quota: 1, // Siapa cepat dia dapat (1 personil mengunci tiket)
            tactical_orders: `Siaran Terbuka: Respon Cepat 110 ke ${input.tkpAlamatTeks} (${targetStation ? targetStation.station_name : resolvedSektor})`,
            dispatch_status_id: 1,
            dispatch_status: 'DISPATCHED',
            dispatched_at: new Date(),
            escalation_deadline_at: escalationDeadline,
            // 3.B: Mileage & Audit BBM Logistik
            mako_start_lat: targetStation?.office_lat || null,
            mako_start_lng: targetStation?.office_lng || null,
            round_trip_km: fuelAuditEst?.roundTripKm || null,
            fuel_liters_used: fuelAuditEst?.fuelLitersUsed || null,
            fuel_cost_estimated: fuelAuditEst?.fuelCostEstimated || null,
            fuel_claim_status_id: defaultClaimStatus ? defaultClaimStatus.id : null,
          } as any,
        });
      }

      // Catat Audit Log Lengkap dengan Catatan Wilayah & Timer
      const actorName = auth.user.fullName ? auth.user.fullName : 'Operator CAD 110';
      const actorRole = auth.user.role ? auth.user.role : 'OPERATOR';
      const stationInfo = targetStation ? `Wilayah: ${targetStation.station_name}` : `Sektor: ${resolvedSektor}`;
      const urgensiInfo = `Urgensi: ${urgensi}${deadlineMinutes ? ` (Timer Eskalasi: ${deadlineMinutes} Menit)` : ''}`;

      await tx.complaintAuditLog.create({
        data: {
          complaint_id: complaintIdBig,
          actor_name: actorName,
          actor_role: actorRole,
          action: 'BROADCAST_DISPATCH',
          notes: `Siaran Serentak (Open Broadcast 110): Disiarkan ke armada siaga. ${stationInfo}. ${urgensiInfo}. Petugas: ${actorName}. Mode: Siapa cepat dia dapat.`,
        },
      });
    }, {
      maxWait: 10000,
      timeout: 20000,
    });



    // 4. Background Secondary Dispatcher (WhatsApp Notifier Taktis - Non-blocking)
    (async () => {
      try {
        const { WhatsAppService } = await import('@/infrastructure/services/whatsapp.service');
        const cleanJenis = input.jenisKejadian || input.kategoriLaporan || 'Layanan Darurat 110';
        const ringkasan = input.ringkasanKeterangan || input.deskripsiKejadian || '-';

        // A. Notifikasi ke Ka SPKT / Petugas Piket SPKT Polsek yang bertugas hari itu (DILARANG pakai phone_piket statis)
        if (targetStation && (isDarurat || isSedang)) {
          const spktDuty = await getActiveSpktDutyOfficerPhone(targetStation.id);
          if (spktDuty?.phone) {
            WhatsAppService.sendPolsekNotice({
              nomorTiket: complaintData.nomorTiket || `#${complaintIdBig}`,
              polsekName: targetStation.station_name,
              polsekHp: spktDuty.phone,
              jenisKejadian: cleanJenis,
              urgensi,
              tkpAlamatTeks: input.tkpAlamatTeks,
              tkpLat: Number(input.tkpLat),
              tkpLng: Number(input.tkpLng),
              pelaporNama: input.pelaporNama || input.namaPelapor,
              pelaporHp: input.pelaporHp || input.noHpPelapor,
              ringkasan,
              deadlineMinutes: deadlineMinutes || 3,
            }).then(async (res) => {
              if (res.success) {
                await prisma.complaintDispatch.updateMany({
                  where: { complaint_id: complaintIdBig },
                  data: { wa_polsek_status: 'SENT' } as any,
                }).catch(() => {});
              }
            }).catch((err) => console.warn('[Auto-WA Polsek Error]:', err));
          } else {
            console.log(`[Auto-WA Polsek]: Tidak ada nomor HP Ka SPKT / Personil Piket bertugas hari ini di ${targetStation.station_name}.`);
          }
        }

        // B. Notifikasi ke Personel Lapangan Terdekat: HANYA yang menginduk dan piket di Mako tersebut
        if (isDarurat && targetStation) {
          // Cari personil yang menginduk di Mako tiket dan sedang dinas patroli/piket
          const activeOfficers = await prisma.policeOfficer.findMany({
            where: {
              station_id: targetStation.id,
              duty_status: { in: ['DINAS_PATROLI', 'PIKET_SPKT'] },
              user: { phone_number: { not: '' } },
            },
            include: { user: true },
          });

          // Jika tidak ada yang DINAS_PATROLI/PIKET_SPKT, cek personil mako yang tidak LEPAS_DINAS
          const candidates = activeOfficers.length > 0 
            ? activeOfficers 
            : await prisma.policeOfficer.findMany({
                where: {
                  station_id: targetStation.id,
                  duty_status: { not: 'LEPAS_DINAS' },
                  user: { phone_number: { not: '' } },
                },
                include: { user: true },
              });

          // HAPUS TOTAL FALLBACK KE MAKO LAIN! DILARANG mengambil personil di luar targetStation.id
          if (candidates.length > 0) {
            let nearestOfficer = candidates[0];
            if (input.tkpLat && input.tkpLng) {
              const { HaversineService } = await import('@/infrastructure/services/haversine.service');
              let minOffDist = Infinity;
              for (const off of candidates) {
                if (off.current_gps_lat && off.current_gps_lng) {
                  const d = HaversineService.calculateDistanceKm(
                    Number(input.tkpLat),
                    Number(input.tkpLng),
                    Number(off.current_gps_lat),
                    Number(off.current_gps_lng)
                  );
                  if (d < minOffDist) {
                    minOffDist = d;
                    nearestOfficer = off;
                  }
                }
              }
            }

            if (nearestOfficer?.user?.phone_number) {
              WhatsAppService.sendOfficerAlert({
                nomorTiket: complaintData.nomorTiket || `#${complaintIdBig}`,
                officerNama: `${nearestOfficer.rank_pangkat} ${nearestOfficer.user.full_name}`,
                officerHp: nearestOfficer.user.phone_number,
                jenisKejadian: cleanJenis,
                urgensi,
                tkpAlamatTeks: input.tkpAlamatTeks,
                tkpLat: Number(input.tkpLat),
                tkpLng: Number(input.tkpLng),
                pelaporNama: input.pelaporNama || input.namaPelapor,
                pelaporHp: input.pelaporHp || input.noHpPelapor,
                ringkasan,
                deadlineMinutes: deadlineMinutes || 3,
              }).then(async (res) => {
                if (res.success) {
                  await prisma.complaintDispatch.updateMany({
                    where: { complaint_id: complaintIdBig },
                    data: { wa_officer_status: 'SENT' } as any,
                  }).catch(() => {});
                }
              }).catch((err) => console.warn('[Auto-WA Officer Error]:', err));
            }
          } else {
            console.log(`[Auto-WA Officer]: Tidak ada personil lapangan yang sedang piket di ${targetStation.station_name}. Fallback lintas Mako dicegah.`);
          }
        }
      } catch (waErr) {
        console.warn('[Auto-WA Secondary Dispatcher Error]:', waErr);
      }
    })();

    safeRevalidatePath('/console');
    return {
      success: true,
      data: {
        ...complaintData,
        status: 'MENUNGGU',
        status_id: 1,
        tahap: 1,
        stationName: targetStation?.station_name || resolvedSektor,
        escalationDeadlineAt: escalationDeadline ? escalationDeadline.toISOString() : null,
      },
    };
  } catch (err: any) {
    console.error('Error in auto broadcast dispatch:', err);
    return { success: true, data: complaintData };
  }
}

/**
 * Buat Pengaduan & Langsung Selesaikan di Meja Operator CAD 110 (Layanan Konsultasi / Informasi SOP)
 * Kasus tuntas dilayani operator tanpa memerlukan pergerakan armada siaga / personil ke TKP.
 * Menghasilkan tiket resmi SELESAI (tahap 5), mencatat log audit, dan mengirim tautan kuesioner evaluasi operator ke WhatsApp warga.
 */
export async function createComplaintAndResolveAtOperatorDeskAction(input: CreateComplaintActionInput & {
  resolutionNotes: string;
  sendWhatsAppConfirmation?: boolean;
}): Promise<{
  success: boolean;
  error?: string;
  data?: any;
}> {
  const auth = await requireRole(['OPERATOR', 'PAWAS', 'SUPERADMIN']);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const cleanNotes = (input.resolutionNotes || '').trim();
  if (!cleanNotes) {
    return { success: false, error: 'Catatan penjelasan / petunjuk SOP penyelesaian wajib diisi!' };
  }

  // 1. Buat pengaduan dasar via createComplaintAction
  const createRes = await createComplaintAction(input);
  if (!createRes.success || !createRes.data) {
    return { success: false, error: createRes.error };
  }

  const complaintData = createRes.data;
  if (!complaintData?.id) {
    return { success: false, error: 'ID tiket tidak terbentuk.' };
  }
  const complaintIdBig = BigInt(complaintData.id);
  const nomorTiket = complaintData.nomorTiket;

  try {
    // proxy via IComplaintRepository
    const actorName = auth.user.fullName || 'Operator CAD 110';
    const actorRole = auth.user.role || 'OPERATOR';

    await prisma.$transaction(async (tx) => {
      // Perbarui status menjadi SELESAI, tahap 5, dan catat resolusi di Meja Operator
      await tx.complaint.update({
        where: { id: complaintIdBig },
        data: {
          status: 'SELESAI',
          status_id: 4,
          tahap: 5,
          operator_id: auth.user.userId ? BigInt(auth.user.userId) : null,
          resolution_location_key: 'OPERATOR_DESK',
          resolution_location_name: 'Meja Operator CAD 110',
          resolution_document_key: 'KONSULTASI_SELESAI',
          resolution_document_name: 'Layanan Informasi / Konsultasi SOP 110',
        },
      });

      // Catat Complaint Audit Log
      await tx.complaintAuditLog.create({
        data: {
          complaint_id: complaintIdBig,
          actor_name: actorName,
          actor_role: actorRole,
          action: 'RESOLVED_AT_OPERATOR_DESK',
          notes: cleanNotes,
        },
      });
    }, {
      maxWait: 10000,
      timeout: 20000,
    });

    // Kirim notifikasi WhatsApp resmi dengan tautan kuesioner evaluasi operator (non-blocking)
    const phone = input.pelaporHp || input.noHpPelapor;
    if (input.sendWhatsAppConfirmation !== false && phone && phone !== '-') {
      (async () => {
        try {
          const { WhatsAppService } = await import('@/infrastructure/services/whatsapp.service');
          const sendRes = await WhatsAppService.sendOperatorConsultationNotification({
            nomorTiket,
            pelaporNama: input.pelaporNama || input.namaPelapor,
            pelaporHp: phone,
            jenisKejadian: input.jenisKejadian || input.kategoriLaporan || 'Layanan Informasi & Konsultasi 110',
            operatorNotes: cleanNotes,
            operatorName: actorName,
          });

          if (sendRes.success) {
            // proxy via IComplaintRepository
            await prisma.complaintAuditLog.create({
              data: {
                complaint_id: complaintIdBig,
                actor_name: 'Sistem Gateway WhatsApp',
                actor_role: 'SYSTEM',
                action: 'WHATSAPP_NOTIFICATION',
                notes: `Konfirmasi penyelesaian konsultasi & tautan kuesioner operator terkirim ke ${phone}. Status: ${sendRes.statusText}`,
              },
            }).catch(() => {});
          }
        } catch (wErr) {
          console.warn('[WhatsApp Consultation Notification Error]:', wErr);
        }
      })();
    }

    safeRevalidatePath('/console');
    return {
      success: true,
      data: {
        ...complaintData,
        status: 'SELESAI',
        tahap: 5,
        resolutionLocationKey: 'OPERATOR_DESK',
        resolutionDocumentKey: 'KONSULTASI_SELESAI',
        resolutionNotes: cleanNotes,
        operatorName: actorName,
      },
    };
  } catch (err: any) {
    console.error('Error in resolve at operator desk:', err);
    return { success: false, error: err.message || 'Gagal menyelesaikan pengaduan di meja operator.' };
  }
}

/**
 * Selesaikan Pengaduan yang Sedang Antre Langsung di Meja Operator CAD 110
 * Untuk laporan yang sudah terlanjur tercatat di antrean pawas namun setelah diverifikasi/ditelepon balik
 * merupakan permohonan informasi/konsultasi SOP yang tuntas langsung oleh operator.
 */
export async function resolveQueuedComplaintAtOperatorDeskAction(input: {
  complaintId: string | number;
  resolutionNotes: string;
  sendWhatsAppConfirmation?: boolean;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  const auth = await requireRole(['OPERATOR', 'PAWAS', 'SUPERADMIN']);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const cleanNotes = (input.resolutionNotes || '').trim();
  if (!cleanNotes) {
    return { success: false, error: 'Catatan penjelasan / petunjuk SOP penyelesaian wajib diisi!' };
  }

  try {
    // proxy via IComplaintRepository
    const complaintIdBig = BigInt(input.complaintId);

    const existing = await prisma.complaint.findUnique({
      where: { id: complaintIdBig },
      select: {
        id: true,
        nomor_tiket: true,
        pelapor_nama: true,
        pelapor_hp: true,
        jenis_kejadian: true,
      },
    });

    if (!existing) {
      return { success: false, error: 'Data pengaduan tidak ditemukan.' };
    }

    const actorName = auth.user.fullName || 'Operator CAD 110';
    const actorRole = auth.user.role || 'OPERATOR';

    await prisma.$transaction(async (tx) => {
      await tx.complaint.update({
        where: { id: complaintIdBig },
        data: {
          status: 'SELESAI',
          status_id: 4,
          tahap: 5,
          operator_id: auth.user.userId ? BigInt(auth.user.userId) : null,
          resolution_location_key: 'OPERATOR_DESK',
          resolution_location_name: 'Meja Operator CAD 110',
          resolution_document_key: 'KONSULTASI_SELESAI',
          resolution_document_name: 'Layanan Informasi / Konsultasi SOP 110',
        },
      });

      // Batalkan atau selesaikan dispatch jika ada
      await tx.complaintDispatch.updateMany({
        where: { complaint_id: complaintIdBig },
        data: {
          dispatch_status: 'COMPLETED',
          dispatch_status_id: 5,
          completed_at: new Date(),
        },
      });

      // Catat log audit
      await tx.complaintAuditLog.create({
        data: {
          complaint_id: complaintIdBig,
          actor_name: actorName,
          actor_role: actorRole,
          action: 'RESOLVED_AT_OPERATOR_DESK',
          notes: cleanNotes,
        },
      });
    }, {
      maxWait: 10000,
      timeout: 20000,
    });

    // Kirim notifikasi WhatsApp
    if (input.sendWhatsAppConfirmation !== false && existing.pelapor_hp && existing.pelapor_hp !== '-') {
      (async () => {
        try {
          const { WhatsAppService } = await import('@/infrastructure/services/whatsapp.service');
          const sendRes = await WhatsAppService.sendOperatorConsultationNotification({
            nomorTiket: existing.nomor_tiket,
            pelaporNama: existing.pelapor_nama,
            pelaporHp: existing.pelapor_hp,
            jenisKejadian: existing.jenis_kejadian,
            operatorNotes: cleanNotes,
            operatorName: actorName,
          });

          if (sendRes.success) {
            // proxy via IComplaintRepository
            await prisma.complaintAuditLog.create({
              data: {
                complaint_id: complaintIdBig,
                actor_name: 'Sistem Gateway WhatsApp',
                actor_role: 'SYSTEM',
                action: 'WHATSAPP_NOTIFICATION',
                notes: `Konfirmasi penyelesaian konsultasi & tautan kuesioner operator terkirim ke ${existing.pelapor_hp}. Status: ${sendRes.statusText}`,
              },
            }).catch(() => {});
          }
        } catch (wErr) {
          console.warn('[WhatsApp Consultation Notification Error]:', wErr);
        }
      })();
    }

    safeRevalidatePath('/console');
    return { success: true };
  } catch (err: any) {
    console.error('Error in resolveQueuedComplaintAtOperatorDeskAction:', err);
    return { success: false, error: err.message || 'Gagal menyelesaikan pengaduan di meja operator.' };
  }
}
