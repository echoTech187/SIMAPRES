'use server';

import { UseCaseFactory } from '@/application/factories/use-case.factory';
import { ComplaintStatus, UrgensiLevel } from '@/domain/entities/complaint.entity';
import { cacheGet, cacheSet } from '@/infrastructure/cache/app-cache';
import { requireRole } from '@/lib/session';
import {
  getComplaintRepo,
  prisma,
  safeRevalidatePath,
  serializeBigInt,
} from './complaint-common';

export async function getIkmStatsAction(stationId?: number | string) {
  const auth = await requireRole(['PAWAS', 'OPERATOR', 'SUPERADMIN']);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const numStationId = stationId ? Number(stationId) : undefined;
  const cacheKey = numStationId ? `ikm_stats_st_${numStationId}` : 'ikm_stats';
  const cached = cacheGet<any>(cacheKey);
  if (cached) {
    return cached;
  }
  try {
    const repo = UseCaseFactory.getComplaintRepository();
    const stats = await repo.getIkmStats(numStationId);
    const result = { success: true, data: stats };
    cacheSet(cacheKey, result, 60000); // 60 detik TTL
    return result;
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil statistik IKM.' };
  }
}


export interface OfficerPerformanceRankItem {
  officerId: string;
  nrp: string;
  namaLengkap: string;
  pangkat: string;
  jabatan: string;
  unit: string;
  assignedPatrolVehicle: string;
  avatarUrl?: string | null;
  totalDiterima: number;
  totalSelesai: number;
  totalProses: number;
  completionRate: number;
  avgResponseTimeMinutes: number | null;
  avgRating: number;
  totalReviews: number;
  predikat: string;
  predikatColor: string;
  recentReviewText?: string | null;
}

/**
 * Mengambil data ranking performa seluruh personel piket:
 * 1. Peringkat Produktivitas (Paling banyak menerima dan menyelesaikan tiket)
 * 2. Peringkat Kepuasan Masyarakat (Rating IKM Bintang 1 - 5)
 */
export async function getOfficerPerformanceRankingsAction(stationId?: number | string) {
  const auth = await requireRole(['PAWAS', 'OPERATOR', 'SUPERADMIN']);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const numStationId = stationId ? Number(stationId) : undefined;
  const cacheKey = numStationId ? `officer_performance_rankings_st_${numStationId}` : 'officer_performance_rankings';
  const cached = cacheGet<any>(cacheKey);
  if (cached) {
    return { success: true, data: cached };
  }

  try {
    // proxy via IComplaintRepository
    const { Prisma } = await import('@prisma/client');

    let items: OfficerPerformanceRankItem[] | null = null;

    try {
      const rows: any[] = await prisma.$queryRaw`
        SELECT 
          po.id as officer_id,
          po.nrp,
          po.rank_pangkat,
          po.jabatan,
          po.assigned_patrol_vehicle,
          po.avatar_url,
          u.full_name,
          un.unit_name,
          un.short_name as unit_short_name,
          
          COUNT(d.id) as total_diterima,
          SUM(CASE WHEN d.dispatch_status = 'COMPLETED' OR d.completed_at IS NOT NULL THEN 1 ELSE 0 END) as total_selesai,
          SUM(CASE WHEN (d.dispatch_status != 'COMPLETED' AND d.completed_at IS NULL) THEN 1 ELSE 0 END) as total_proses,
          
          AVG(CASE 
            WHEN d.arrived_at IS NOT NULL AND d.dispatched_at IS NOT NULL AND d.arrived_at >= d.dispatched_at
            THEN TIMESTAMPDIFF(MINUTE, d.dispatched_at, d.arrived_at)
            ELSE NULL
          END) as avg_response_time,
          
          AVG(cr.star_rating) as avg_rating,
          COUNT(cr.id) as total_reviews,
          (
            SELECT cr2.review_text
            FROM complaint_dispatches d2
            JOIN citizen_reviews cr2 ON cr2.complaint_id = d2.complaint_id
            WHERE d2.officer_id = po.id AND cr2.review_text IS NOT NULL AND cr2.review_text != ''
            ORDER BY cr2.created_at DESC
            LIMIT 1
          ) as recent_review_text
          
        FROM police_officers po
        LEFT JOIN users u ON u.id = po.user_id
        LEFT JOIN master_operational_units un ON un.id = po.unit_id
        LEFT JOIN complaint_dispatches d ON d.officer_id = po.id
        LEFT JOIN citizen_reviews cr ON cr.complaint_id = d.complaint_id AND (d.dispatch_status = 'COMPLETED' OR d.completed_at IS NOT NULL)
        ${numStationId ? Prisma.sql`WHERE po.station_id = ${numStationId}` : Prisma.empty}
        GROUP BY po.id, po.nrp, po.rank_pangkat, po.jabatan, po.assigned_patrol_vehicle, po.avatar_url, u.full_name, un.unit_name, un.short_name
        ORDER BY po.id ASC;
      `;

      if (Array.isArray(rows)) {
        items = rows.map((r: any) => {
          const totalDiterima = Number(r.total_diterima || 0);
          const totalSelesai = Number(r.total_selesai || 0);
          const totalProses = Number(r.total_proses || 0);
          const completionRate = totalDiterima > 0 ? Math.round((totalSelesai / totalDiterima) * 100) : 0;
          const avgResponseTimeMinutes = r.avg_response_time !== null ? Math.round(Number(r.avg_response_time)) : null;
          const avgRating = r.avg_rating !== null ? Math.round(Number(r.avg_rating) * 10) / 10 : 0;
          const totalReviews = Number(r.total_reviews || 0);

          let predikat = 'Belum Ada Ulasan';
          let predikatColor = '#64748B';

          if (totalProses > 0 && totalSelesai === 0) {
            predikat = 'Sedang Bertugas';
            predikatColor = '#2563EB';
          } else if (avgRating >= 4.7) {
            predikat = 'Sangat Presisi (Teladan)';
            predikatColor = '#059669';
          } else if (avgRating >= 4.0) {
            predikat = 'Pelayanan Baik';
            predikatColor = '#2563EB';
          } else if (avgRating > 0) {
            predikat = 'Perlu Evaluasi';
            predikatColor = '#D97706';
          }

          return {
            officerId: r.officer_id.toString(),
            nrp: r.nrp,
            namaLengkap: r.full_name || r.nrp,
            pangkat: r.rank_pangkat,
            jabatan: r.jabatan,
            unit: r.unit_short_name || r.unit_name || r.jabatan,
            assignedPatrolVehicle: r.assigned_patrol_vehicle || '-',
            avatarUrl: r.avatar_url,
            totalDiterima,
            totalSelesai,
            totalProses,
            completionRate,
            avgResponseTimeMinutes,
            avgRating,
            totalReviews,
            predikat,
            predikatColor,
            recentReviewText: r.recent_review_text || null,
          };
        });
      }
    } catch (_rawErr) {
      // Fallback ke Prisma findMany
    }

    if (!items) {
      const officers = await prisma.policeOfficer.findMany({
        where: numStationId ? { station_id: numStationId } : undefined,
        include: {
          user: { select: { id: true, full_name: true, is_active: true } },
          unit: { select: { unit_name: true, short_name: true } },
          dispatches: {
            select: {
              dispatch_status: true,
              dispatched_at: true,
              arrived_at: true,
              completed_at: true,
              complaint: {
                select: {
                  citizen_review_rel: {
                    select: {
                      star_rating: true,
                      review_text: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { id: 'asc' },
      });

      items = officers.map((off) => {
        const dispatches = off.dispatches || [];
        const totalDiterima = dispatches.length;

        let totalSelesai = 0;
        let totalProses = 0;
        let totalResponseTime = 0;
        let responseCount = 0;
        let totalStars = 0;
        let reviewCount = 0;
        let recentReviewText: string | null = null;

        for (const d of dispatches) {
          const c = d.complaint;
          if (!c) continue;

          const isOfficerCompleted = d.dispatch_status === 'COMPLETED' || d.completed_at != null;

          if (isOfficerCompleted) {
            totalSelesai++;
          } else {
            totalProses++;
          }

          const dispatchTime = d.dispatched_at ? new Date(d.dispatched_at).getTime() : null;
          const arrivalTime = d.arrived_at ? new Date(d.arrived_at).getTime() : null;

          if (dispatchTime && arrivalTime && arrivalTime >= dispatchTime) {
            const diffMin = Math.round((arrivalTime - dispatchTime) / 60000);
            if (diffMin >= 0) {
              totalResponseTime += Math.max(1, diffMin);
              responseCount++;
            }
          }

          if (isOfficerCompleted && c.citizen_review_rel?.star_rating) {
            totalStars += c.citizen_review_rel.star_rating;
            reviewCount++;
            if (!recentReviewText && c.citizen_review_rel.review_text) {
              recentReviewText = c.citizen_review_rel.review_text;
            }
          }
        }

        const completionRate = totalDiterima > 0 ? Math.round((totalSelesai / totalDiterima) * 100) : 0;
        const avgResponseTimeMinutes = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : null;

        let avgRating = 0;
        if (reviewCount > 0) {
          avgRating = Math.round((totalStars / reviewCount) * 10) / 10;
        }

        let predikat = 'Belum Ada Ulasan';
        let predikatColor = '#64748B';

        if (totalProses > 0 && totalSelesai === 0) {
          predikat = 'Sedang Bertugas';
          predikatColor = '#2563EB';
        } else if (avgRating >= 4.7) {
          predikat = 'Sangat Presisi (Teladan)';
          predikatColor = '#059669';
        } else if (avgRating >= 4.0) {
          predikat = 'Pelayanan Baik';
          predikatColor = '#2563EB';
        } else if (avgRating > 0) {
          predikat = 'Perlu Evaluasi';
          predikatColor = '#D97706';
        }

        return {
          officerId: off.id.toString(),
          nrp: off.nrp,
          namaLengkap: off.user?.full_name || off.nrp,
          pangkat: off.rank_pangkat,
          jabatan: off.jabatan,
          unit: off.unit?.short_name || off.unit?.unit_name || off.jabatan,
          assignedPatrolVehicle: off.assigned_patrol_vehicle || '-',
          avatarUrl: off.avatar_url,
          totalDiterima,
          totalSelesai,
          totalProses,
          completionRate,
          avgResponseTimeMinutes,
          avgRating,
          totalReviews: reviewCount,
          predikat,
          predikatColor,
          recentReviewText,
        };
      });
    }

    const safeItems = items || [];

    const productivityRanking = [...safeItems].sort((a, b) => {
      if (b.totalSelesai !== a.totalSelesai) return b.totalSelesai - a.totalSelesai;
      if (b.completionRate !== a.completionRate) return b.completionRate - a.completionRate;
      if (b.totalDiterima !== a.totalDiterima) return b.totalDiterima - a.totalDiterima;
      const aTime = a.avgResponseTimeMinutes ?? 999999;
      const bTime = b.avgResponseTimeMinutes ?? 999999;
      return aTime - bTime;
    });

    const satisfactionRanking = [...safeItems].sort((a, b) => {
      if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
      if (b.totalReviews !== a.totalReviews) return b.totalReviews - a.totalReviews;
      return b.totalSelesai - a.totalSelesai;
    });

    const payload = {
      productivityRanking,
      satisfactionRanking,
      totalOfficers: safeItems.length,
    };

    cacheSet(cacheKey, payload, 60000); // 60 detik TTL

    return {
      success: true,
      data: payload,
    };
  } catch (error: any) {
    return { success: false, error: error.message ? error.message : 'Gagal memuat ranking personel.' };
  }
}

export interface StationPerformanceRankItem {
  stationId: number;
  stationCode: string;
  stationName: string;
  stationLevel: string;
  phonePiket?: string | null;
  phoneKapolsek?: string | null;
  totalMasuk: number;
  totalSelesai: number;
  totalDiproses: number;
  totalMenunggu: number;
  totalDitolak: number;
  completionRate: number;
  avgResponseTimeMinutes: number | null;
  avgRating: number;
  totalReviews: number;
  slaStatus: 'HIJAU' | 'KUNING' | 'MERAH' | 'NETRAL';
  slaStatusLabel: string;
  slaStatusColor: string;
  slaStatusBg: string;
  rankScore: number;
}

/**
 * Mengambil data ranking performa seluruh Polsek Jajaran & Mako (Tier 1 Leaderboard):
 * - Average Response Time (Waktu Tanggap)
 * - Completion Rate (Tingkat Penyelesaian Perkara)
 * - Indeks Kepuasan Masyarakat (IKM)
 * - Status Kepatuhan SLA Presisi
 */
export async function getStationPerformanceRankingsAction() {
  const auth = await requireRole(['PAWAS', 'OPERATOR', 'SUPERADMIN']);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const cached = cacheGet<any>('station_performance_rankings');
  if (cached) {
    return { success: true, data: cached };
  }

  try {
    // proxy via IComplaintRepository

    let items: StationPerformanceRankItem[] | null = null;

    try {
      const rows: any[] = await prisma.$queryRaw`
        SELECT 
          st.id as station_id,
          st.station_code,
          st.station_name,
          st.station_level,
          st.phone_piket,
          st.phone_kapolsek,
          
          COUNT(DISTINCT c.id) as total_masuk,
          COUNT(DISTINCT CASE WHEN c.status = 'SELESAI' THEN c.id ELSE NULL END) as total_selesai,
          COUNT(DISTINCT CASE WHEN c.status = 'DITOLAK' THEN c.id ELSE NULL END) as total_ditolak,
          COUNT(DISTINCT CASE WHEN c.status = 'MENUNGGU' THEN c.id ELSE NULL END) as total_menunggu,
          COUNT(DISTINCT CASE WHEN c.status NOT IN ('SELESAI', 'DITOLAK', 'MENUNGGU') THEN c.id ELSE NULL END) as total_diproses,
          
          AVG(cr.star_rating) as avg_rating,
          COUNT(DISTINCT cr.id) as total_reviews,
          
          AVG(CASE 
            WHEN d.arrived_at IS NOT NULL AND d.dispatched_at IS NOT NULL AND d.arrived_at >= d.dispatched_at
            THEN TIMESTAMPDIFF(MINUTE, d.dispatched_at, d.arrived_at)
            ELSE NULL
          END) as avg_response_time
          
        FROM police_stations st
        LEFT JOIN complaints c ON c.station_id = st.id
        LEFT JOIN citizen_reviews cr ON cr.complaint_id = c.id
        LEFT JOIN complaint_dispatches d ON d.complaint_id = c.id
        WHERE st.is_active = 1 OR st.is_active IS NULL
        GROUP BY st.id, st.station_code, st.station_name, st.station_level, st.phone_piket, st.phone_kapolsek
        ORDER BY st.id ASC;
      `;

      if (Array.isArray(rows)) {
        items = rows.map((r: any) => {
          const totalMasuk = Number(r.total_masuk || 0);
          const totalSelesai = Number(r.total_selesai || 0);
          const totalDiproses = Number(r.total_diproses || 0);
          const totalMenunggu = Number(r.total_menunggu || 0);
          const totalDitolak = Number(r.total_ditolak || 0);
          const completionRate = totalMasuk > 0 ? Math.round((totalSelesai / totalMasuk) * 100) : 0;
          const avgResponseTimeMinutes = r.avg_response_time !== null ? Math.round(Number(r.avg_response_time)) : null;
          const avgRating = r.avg_rating !== null ? Math.round(Number(r.avg_rating) * 10) / 10 : 0;
          const totalReviews = Number(r.total_reviews || 0);

          let slaStatus: 'HIJAU' | 'KUNING' | 'MERAH' | 'NETRAL' = 'NETRAL';
          let slaStatusLabel = 'Belum Ada Penugasan';
          let slaStatusColor = '#64748B';
          let slaStatusBg = '#F1F5F9';

          if (avgResponseTimeMinutes !== null) {
            if (avgResponseTimeMinutes <= 15) {
              slaStatus = 'HIJAU';
              slaStatusLabel = 'Respon Cepat (Presisi)';
              slaStatusColor = '#059669';
              slaStatusBg = '#ECFDF5';
            } else if (avgResponseTimeMinutes <= 30) {
              slaStatus = 'KUNING';
              slaStatusLabel = 'Waspada (Batas Toleransi)';
              slaStatusColor = '#D97706';
              slaStatusBg = '#FEF3C7';
            } else {
              slaStatus = 'MERAH';
              slaStatusLabel = 'Melanggar SLA Tanggap';
              slaStatusColor = '#DC2626';
              slaStatusBg = '#FEE2E2';
            }
          }

          const ratingPart = avgRating > 0 ? (avgRating / 5) * 35 : 0;
          const timePart = avgResponseTimeMinutes !== null ? Math.max(0, 25 - avgResponseTimeMinutes) : 10;
          const rankScore = Math.round((completionRate * 0.4) + ratingPart + timePart);

          return {
            stationId: Number(r.station_id),
            stationCode: r.station_code,
            stationName: r.station_name,
            stationLevel: r.station_level,
            phonePiket: r.phone_piket || null,
            phoneKapolsek: r.phone_kapolsek || null,
            totalMasuk,
            totalSelesai,
            totalDiproses,
            totalMenunggu,
            totalDitolak,
            completionRate,
            avgResponseTimeMinutes,
            avgRating,
            totalReviews,
            slaStatus,
            slaStatusLabel,
            slaStatusColor,
            slaStatusBg,
            rankScore,
          };
        });
      }
    } catch (_rawErr) {
      // Fallback ke Prisma findMany
    }

    if (!items) {
      const [rawStations, allComplaints] = await Promise.all([
        (prisma.policeStation as any).findMany({
          orderBy: { id: 'asc' },
        }),
        prisma.complaint.findMany({
          select: {
            id: true,
            station_id: true,
            status: true,
            created_at: true,
            citizen_review_rel: {
              select: {
                star_rating: true,
                review_text: true,
              },
            },
            dispatches: {
              select: {
                dispatched_at: true,
                arrived_at: true,
                completed_at: true,
                dispatch_status: true,
              },
            },
          },
        }),
      ]);

      const activeStations = (rawStations as any[]).filter((st: any) => st.is_active !== false);

      items = activeStations.map((st: any) => {
      const complaints = allComplaints.filter((c: any) => c.station_id === st.id);
      const totalMasuk = complaints.length;
      let totalSelesai = 0;
      let totalDiproses = 0;
      let totalMenunggu = 0;
      let totalDitolak = 0;

      let totalResponseTimeMinutes = 0;
      let responseCount = 0;
      let totalStars = 0;
      let reviewCount = 0;

      for (const c of complaints) {
        if (c.status === 'SELESAI') totalSelesai++;
        else if (c.status === 'DITOLAK') totalDitolak++;
        else if (c.status === 'MENUNGGU') totalMenunggu++;
        else totalDiproses++;

        if (c.citizen_review_rel?.star_rating) {
          totalStars += c.citizen_review_rel.star_rating;
          reviewCount++;
        }

        if (Array.isArray(c.dispatches) && c.dispatches.length > 0) {
          for (const d of c.dispatches) {
            const start = d.dispatched_at ? new Date(d.dispatched_at).getTime() : new Date(c.created_at).getTime();
            const arr = d.arrived_at ? new Date(d.arrived_at).getTime() : null;
            if (arr && arr >= start) {
              const diffMin = Math.round((arr - start) / 60000);
              if (diffMin >= 0) {
                totalResponseTimeMinutes += Math.max(1, diffMin);
                responseCount++;
                break;
              }
            }
          }
        }
      }

      const completionRate = totalMasuk > 0 ? Math.round((totalSelesai / totalMasuk) * 100) : 0;
      const avgResponseTimeMinutes = responseCount > 0 ? Math.round(totalResponseTimeMinutes / responseCount) : null;
      const avgRating = reviewCount > 0 ? Math.round((totalStars / reviewCount) * 10) / 10 : 0;

      let slaStatus: 'HIJAU' | 'KUNING' | 'MERAH' | 'NETRAL' = 'NETRAL';
      let slaStatusLabel = 'Belum Ada Penugasan';
      let slaStatusColor = '#64748B';
      let slaStatusBg = '#F1F5F9';

      if (avgResponseTimeMinutes !== null) {
        if (avgResponseTimeMinutes <= 15) {
          slaStatus = 'HIJAU';
          slaStatusLabel = 'Respon Cepat (Presisi)';
          slaStatusColor = '#059669';
          slaStatusBg = '#ECFDF5';
        } else if (avgResponseTimeMinutes <= 30) {
          slaStatus = 'KUNING';
          slaStatusLabel = 'Waspada (Batas Toleransi)';
          slaStatusColor = '#D97706';
          slaStatusBg = '#FEF3C7';
        } else {
          slaStatus = 'MERAH';
          slaStatusLabel = 'Melanggar SLA Tanggap';
          slaStatusColor = '#DC2626';
          slaStatusBg = '#FEE2E2';
        }
      }

      const ratingPart = avgRating > 0 ? (avgRating / 5) * 35 : 0;
      const timePart = avgResponseTimeMinutes !== null ? Math.max(0, 25 - avgResponseTimeMinutes) : 10;
      const rankScore = Math.round((completionRate * 0.4) + ratingPart + timePart);

      return {
        stationId: st.id,
        stationCode: st.station_code,
        stationName: st.station_name,
        stationLevel: st.station_level,
        phonePiket: st.phone_piket ? st.phone_piket : null,
        phoneKapolsek: st.phone_kapolsek ? st.phone_kapolsek : null,
        totalMasuk,
        totalSelesai,
        totalDiproses,
        totalMenunggu,
        totalDitolak,
        completionRate,
        avgResponseTimeMinutes,
        avgRating,
        totalReviews: reviewCount,
        slaStatus,
        slaStatusLabel,
        slaStatusColor,
        slaStatusBg,
        rankScore,
      };
    });
    }

    const overallRanking = [...(items || [])].sort((a, b) => {
      if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
      if (b.totalSelesai !== a.totalSelesai) return b.totalSelesai - a.totalSelesai;
      const aTime = a.avgResponseTimeMinutes !== null ? a.avgResponseTimeMinutes : 999999;
      const bTime = b.avgResponseTimeMinutes !== null ? b.avgResponseTimeMinutes : 999999;
      return aTime - bTime;
    });

    const payload = {
      overallRanking,
      totalStations: (items || []).length,
    };

    cacheSet('station_performance_rankings', payload, 60000);

    return {
      success: true,
      data: payload,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message ? error.message : 'Gagal memuat ranking performa Polsek.',
    };
  }
}

export interface OperatorPerformanceRankItem {
  operatorId: string;
  identifier: string; // NRP
  namaLengkap: string;
  pangkat: string;
  role: string;
  stationName: string;
  avatarUrl?: string | null;
  totalTiketInput: number;
  totalDisposisi: number;
  totalSelesai: number;
  validTiketCount?: number;
  validRate?: number;
  avgIntakeMinutes: number;
  sopComplianceRate: number;
  avgRating: number;
  totalReviews: number;
  compositeScore: number;
  rankScore: number;
  rank: number;
  predikat: string;
  predikatColor: string;
  recentReviewText?: string | null;
}

/**
 * Mengambil data ranking performa seluruh Operator SPKT 110 (Tier 3 Leaderboard):
 * - Volume Tiket CAD Diinput
 * - Kecepatan Entri CAD (Intake Time)
 * - Kepatuhan Input SOP & Standar Layanan
 * - Indeks Kepuasan Pelayanan 110 (Rating Bintang Warga)
 * - Skor Komposit Anev Operator (Bobot 100 Poin)
 */
export async function getOperatorPerformanceRankingsAction(stationId?: number | string) {
  const auth = await requireRole(['PAWAS', 'OPERATOR', 'SUPERADMIN']);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const numStationId = stationId ? Number(stationId) : undefined;
  const cacheKey = numStationId ? `operator_performance_rankings_st_${numStationId}` : 'operator_performance_rankings';
  const cached = cacheGet<any>(cacheKey);
  if (cached) {
    return { success: true, data: cached };
  }

  try {
    // proxy via IComplaintRepository
    const { Prisma } = await import('@prisma/client');

    let items: OperatorPerformanceRankItem[] | null = null;

    try {
      const rows: any[] = await prisma.$queryRaw`
        SELECT 
          u.id as operator_id,
          u.identifier,
          u.full_name,
          u.role,
          u.avatar_url,
          st.station_name,
          
          COUNT(DISTINCT c.id) as total_tiket_input,
          COUNT(DISTINCT CASE WHEN c.status != 'MENUNGGU' THEN c.id ELSE NULL END) as total_disposisi,
          COUNT(DISTINCT CASE WHEN c.status = 'SELESAI' THEN c.id ELSE NULL END) as total_selesai,
          COUNT(DISTINCT CASE WHEN c.status != 'DITOLAK' THEN c.id ELSE NULL END) as valid_tiket_count,
          COUNT(DISTINCT CASE WHEN c.subcategory_id IS NOT NULL AND CHAR_LENGTH(TRIM(c.ringkasan_keterangan)) >= 10 THEN c.id ELSE NULL END) as compliant_sop_count,
          
          AVG(cr.star_rating) as avg_rating,
          COUNT(DISTINCT cr.id) as total_reviews,
          (
            SELECT cr2.review_text
            FROM complaints c2
            JOIN citizen_reviews cr2 ON cr2.complaint_id = c2.id
            WHERE c2.operator_id = u.id AND cr2.review_text IS NOT NULL AND cr2.review_text != ''
            ORDER BY cr2.created_at DESC
            LIMIT 1
          ) as recent_review_text,
          
          AVG(CASE 
            WHEN d.dispatched_at IS NOT NULL AND c.created_at IS NOT NULL AND d.dispatched_at >= c.created_at
            THEN LEAST(10, GREATEST(1, TIMESTAMPDIFF(MINUTE, c.created_at, d.dispatched_at)))
            ELSE NULL
          END) as avg_intake_minutes

        FROM users u
        LEFT JOIN police_stations st ON st.id = u.station_id
        LEFT JOIN complaints c ON c.operator_id = u.id
        LEFT JOIN citizen_reviews cr ON cr.complaint_id = c.id
        LEFT JOIN (
          SELECT complaint_id, MIN(dispatched_at) as dispatched_at
          FROM complaint_dispatches
          WHERE dispatched_at IS NOT NULL
          GROUP BY complaint_id
        ) d ON d.complaint_id = c.id
        WHERE u.role = 'OPERATOR' ${numStationId ? Prisma.sql`AND u.station_id = ${numStationId}` : Prisma.empty}
        GROUP BY u.id, u.identifier, u.full_name, u.role, u.avatar_url, st.station_name
        ORDER BY u.id ASC;
      `;

      if (Array.isArray(rows)) {
        items = rows.map((r: any) => {
          const totalTiketInput = Number(r.total_tiket_input || 0);
          const totalDisposisi = Number(r.total_disposisi || 0);
          const totalSelesai = Number(r.total_selesai || 0);
          const validTiketCount = Number(r.valid_tiket_count || 0);
          const compliantSopCount = Number(r.compliant_sop_count || 0);
          const avgIntakeMinutes = r.avg_intake_minutes !== null ? Math.round(Number(r.avg_intake_minutes) * 10) / 10 : 1.0;
          const avgRating = r.avg_rating !== null ? Math.round(Number(r.avg_rating) * 10) / 10 : 0;
          const reviewCount = Number(r.total_reviews || 0);
          const recentReviewText = r.recent_review_text || null;

          const sopComplianceRate = totalTiketInput > 0 ? Math.round((compliantSopCount / totalTiketInput) * 100) : 100;
          const validRate = totalTiketInput > 0 ? Math.round((validTiketCount / totalTiketInput) * 100) : 100;

          // Opsi 1: Bobot Penilaian Murni Tanggung Jawab Meja Operator (100 Pts)
          // 1. Produktivitas Input Tiket (Bobot 40 Pts) - 1 tiket = 8 pts, >= 5 tiket = 40 pts
          const volumeScore = Math.min(40, totalTiketInput * 8);
          // 2. Kerapian & Kepatuhan SOP Input Data (Bobot 30 Pts)
          const sopScore = Math.round((sopComplianceRate / 100) * 30);
          // 3. Validitas Tiket / Tidak Ditolak (Bobot 15 Pts)
          const validScore = Math.round((validRate / 100) * 15);
          // 4. Rating Kepuasan Pelapor (Bobot 15 Pts)
          const ratingScore = avgRating > 0 ? Math.round((avgRating / 5) * 15) : (totalTiketInput > 0 ? 12 : 0);

          const compositeScore = totalTiketInput > 0
            ? Math.min(100, Math.round(volumeScore + sopScore + validScore + ratingScore))
            : 0;

          let predikat = 'Siaga (Belum Ada Tiket)';
          let predikatColor = '#64748B';

          if (totalTiketInput > 0) {
            if (compositeScore >= 90) {
              predikat = 'Operator Teladan 110';
              predikatColor = '#059669';
            } else if (compositeScore >= 75) {
              predikat = 'Pelayanan Baik';
              predikatColor = '#2563EB';
            } else if (compositeScore >= 60) {
              predikat = 'Cukup (Siaga Standar)';
              predikatColor = '#D97706';
            } else {
              predikat = 'Perlu Evaluasi SOP';
              predikatColor = '#DC2626';
            }
          }

          const fullName = r.full_name || '';
          const nameParts = fullName.split(' ');
          const pangkatCandidate = nameParts.length > 1 ? nameParts[0] : 'Bripka';
          const pangkat = ['Aiptu', 'Aipda', 'Bripka', 'Brigadir', 'Briptu', 'Bripda', 'Ipda'].includes(pangkatCandidate)
            ? pangkatCandidate
            : 'Operator SPKT';

          return {
            operatorId: String(r.operator_id),
            identifier: r.identifier || '',
            namaLengkap: fullName,
            pangkat,
            role: r.role || 'OPERATOR',
            stationName: r.station_name || 'SPKT Mako Polres Pekalongan',
            avatarUrl: r.avatar_url || null,
            totalTiketInput,
            totalDisposisi,
            totalSelesai,
            validTiketCount,
            validRate,
            avgIntakeMinutes,
            sopComplianceRate,
            avgRating,
            totalReviews: reviewCount,
            compositeScore,
            rankScore: compositeScore,
            rank: 1,
            predikat,
            predikatColor,
            recentReviewText,
          };
        });
      }
    } catch (_rawErr) {
      // Fallback ke Prisma findMany
    }

    if (!items) {
      const [operators, allComplaints] = await Promise.all([
        prisma.user.findMany({
          where: {
            role: 'OPERATOR',
            ...(numStationId ? { station_id: numStationId } : {}),
          },
          include: {
            station: { select: { station_name: true } },
          },
          orderBy: { id: 'asc' },
        }),
        prisma.complaint.findMany({
          select: {
            id: true,
            operator_id: true,
            status: true,
            created_at: true,
            category_id: true,
            subcategory_id: true,
            ringkasan_keterangan: true,
            citizen_review_rel: {
              select: {
                star_rating: true,
                review_text: true,
              },
            },
            dispatches: {
              select: {
                dispatched_at: true,
              },
              take: 1,
              orderBy: { id: 'asc' },
            },
          },
        }),
      ]);

      items = operators.map((op) => {
      const opId = op.id;
      const opComplaints = allComplaints.filter((c) => c.operator_id === opId);
      const totalTiketInput = opComplaints.length;

      let totalDisposisi = 0;
      let totalSelesai = 0;
      let totalIntakeMinutes = 0;
      let intakeCount = 0;
      let compliantSopCount = 0;
      let totalStars = 0;
      let reviewCount = 0;
      let recentReviewText: string | null = null;

      for (const c of opComplaints) {
        if (c.status !== 'MENUNGGU') {
          totalDisposisi++;
        }
        if (c.status === 'SELESAI') {
          totalSelesai++;
        }

        const hasSubcat = c.subcategory_id !== null;
        const hasText = (c.ringkasan_keterangan ? c.ringkasan_keterangan.trim().length : 0) >= 10;
        if (hasSubcat && hasText) {
          compliantSopCount++;
        }

        if (c.created_at && c.dispatches && c.dispatches.length > 0 && c.dispatches[0].dispatched_at) {
          const createTime = new Date(c.created_at).getTime();
          const dispTime = new Date(c.dispatches[0].dispatched_at).getTime();
          if (dispTime >= createTime) {
            const diffMin = Math.round((dispTime - createTime) / 60000);
            totalIntakeMinutes += Math.max(1, Math.min(10, diffMin));
            intakeCount++;
          }
        }

        if (c.citizen_review_rel?.star_rating) {
          totalStars += c.citizen_review_rel.star_rating;
          reviewCount++;
          if (!recentReviewText && c.citizen_review_rel.review_text) {
            recentReviewText = c.citizen_review_rel.review_text;
          }
        }
      }

      const validTiketCount = opComplaints.filter((c) => c.status !== 'DITOLAK').length;
      const validRate = totalTiketInput > 0 ? Math.round((validTiketCount / totalTiketInput) * 100) : 100;
      const sopComplianceRate = totalTiketInput > 0 ? Math.round((compliantSopCount / totalTiketInput) * 100) : 100;
      const avgIntakeMinutes = intakeCount > 0 ? Math.round((totalIntakeMinutes / intakeCount) * 10) / 10 : 1.0;
      const avgRating = reviewCount > 0 ? Math.round((totalStars / reviewCount) * 10) / 10 : 0;

      // Opsi 1: Bobot Penilaian Murni Tanggung Jawab Meja Operator (100 Pts)
      const volumeScore = Math.min(40, totalTiketInput * 8);
      const sopScore = Math.round((sopComplianceRate / 100) * 30);
      const validScore = Math.round((validRate / 100) * 15);
      const ratingScore = avgRating > 0 ? Math.round((avgRating / 5) * 15) : (totalTiketInput > 0 ? 12 : 0);
      const compositeScore = totalTiketInput > 0 ? Math.min(100, Math.round(volumeScore + sopScore + validScore + ratingScore)) : 0;

      let predikat = 'Siaga (Belum Ada Tiket)';
      let predikatColor = '#64748B';

      if (totalTiketInput > 0) {
        if (compositeScore >= 90) {
          predikat = 'Operator Teladan 110';
          predikatColor = '#059669';
        } else if (compositeScore >= 75) {
          predikat = 'Pelayanan Baik';
          predikatColor = '#2563EB';
        } else if (compositeScore >= 60) {
          predikat = 'Cukup (Siaga Standar)';
          predikatColor = '#D97706';
        } else {
          predikat = 'Perlu Evaluasi SOP';
          predikatColor = '#DC2626';
        }
      }

      const nameParts = op.full_name.split(' ');
      const pangkatCandidate = nameParts.length > 1 ? nameParts[0] : 'Bripka';
      const pangkat = ['Aiptu', 'Aipda', 'Bripka', 'Brigadir', 'Briptu', 'Bripda', 'Ipda'].includes(pangkatCandidate)
        ? pangkatCandidate
        : 'Operator SPKT';

      return {
        operatorId: op.id.toString(),
        identifier: op.identifier,
        namaLengkap: op.full_name,
        pangkat,
        role: op.role,
        stationName: op.station?.station_name ? op.station.station_name : 'SPKT Mako Polres Pekalongan',
        avatarUrl: op.avatar_url,
        totalTiketInput,
        totalDisposisi,
        totalSelesai,
        validTiketCount,
        validRate,
        avgIntakeMinutes,
        sopComplianceRate,
        avgRating,
        totalReviews: reviewCount,
        compositeScore,
        rankScore: compositeScore,
        rank: 1,
        predikat,
        predikatColor,
        recentReviewText,
      };
    });
    }

    const overallRanking = [...(items || [])].sort((a, b) => b.compositeScore - a.compositeScore).map((item, idx) => ({ ...item, rank: idx + 1 }));
    const productivityRanking = [...(items || [])].sort((a, b) => b.totalTiketInput - a.totalTiketInput).map((item, idx) => ({ ...item, rank: idx + 1 }));
    const satisfactionRanking = [...(items || [])].sort((a, b) => b.avgRating - a.avgRating).map((item, idx) => ({ ...item, rank: idx + 1 }));

    const payload = {
      overallRanking,
      productivityRanking,
      satisfactionRanking,
      totalOperators: (items || []).length,
    };

    cacheSet(cacheKey, payload, 60000);

    return {
      success: true,
      data: payload,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message ? error.message : 'Gagal memuat ranking performa Operator.',
    };
  }
}
