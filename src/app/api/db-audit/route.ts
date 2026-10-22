import { NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma.client';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const shouldFix = url.searchParams.get('fix') === 'true';

    // 1. Audit complaint_audit_logs
    const allAuditLogs = await (prisma as any).complaintAuditLog.findMany({
      orderBy: { id: 'asc' },
    });

    const auditLogAnomalies: any[] = [];
    const logsToFixIds: any[] = [];

    for (const log of allAuditLogs) {
      const nameLower = (log.actor_name || '').toLowerCase();
      const actionLower = (log.action || '').toLowerCase();
      const isPersonilRank =
        nameLower.includes('bripka') ||
        nameLower.includes('briptu') ||
        nameLower.includes('bripda') ||
        nameLower.includes('brigadir') ||
        nameLower.includes('aipda') ||
        nameLower.includes('aiptu') ||
        nameLower.includes('bharada') ||
        nameLower.includes('personel') ||
        nameLower.includes('personil');

      const isFieldAction =
        actionLower.includes('meluncur') ||
        actionLower.includes('tiba') ||
        actionLower.includes('tindakan') ||
        actionLower.includes('diterima personil');

      if (log.actor_role === 'PAWAS' && (isPersonilRank || isFieldAction)) {
        auditLogAnomalies.push({
          id: log.id.toString(),
          complaint_id: log.complaint_id.toString(),
          actor_name: log.actor_name,
          actor_role_current: log.actor_role,
          actor_role_expected: 'PERSONIL',
          action: log.action,
          reason: isPersonilRank
            ? `Pangkat (${log.actor_name}) adalah Bintara/Personel Lapangan, bukan Perwira Pengawas (Pawas)`
            : `Tindakan '${log.action}' merupakan tindakan operasional lapangan personel`,
        });
        logsToFixIds.push(log.id);
      }
    }

    // 2. Audit complaint_dispatches
    const allDispatches = await (prisma as any).complaintDispatch.findMany({
      include: {
        complaint: { select: { id: true, nomor_tiket: true, status: true, tahap: true } },
        officer: { select: { id: true, nrp: true, rank_pangkat: true } },
      },
      orderBy: { id: 'asc' },
    });

    const dispatchAnomalies: any[] = [];
    const dispatchesToFixDeparted: any[] = [];

    for (const d of allDispatches) {
      // Anomaly: Arrived or completed but departed_at is null
      if ((d.arrived_at || d.completed_at) && !d.departed_at) {
        dispatchAnomalies.push({
          id: d.id.toString(),
          complaint_id: d.complaint_id.toString(),
          ticket: d.complaint?.nomor_tiket,
          dispatch_status: d.dispatch_status,
          complaint_status: d.complaint?.status,
          issue: 'departed_at bernilai NULL padahal personel sudah tiba/selesai',
        });
        dispatchesToFixDeparted.push({
          id: d.id,
          departed_at: d.accepted_at || d.dispatched_at || new Date(),
        });
      }
    }

    // 3. Audit Complaints Status vs Tahap
    const allComplaints = await (prisma as any).complaint.findMany({
      select: {
        id: true,
        nomor_tiket: true,
        status: true,
        tahap: true,
      },
    });

    const complaintAnomalies: any[] = [];
    for (const c of allComplaints) {
      if (c.status === 'SELESAI' && c.tahap !== 5) {
        complaintAnomalies.push({
          id: c.id.toString(),
          nomor_tiket: c.nomor_tiket,
          status: c.status,
          tahap: c.tahap,
          expected_tahap: 5,
          issue: 'Status SELESAI tetapi tahap bukan 5',
        });
      } else if (c.status === 'TIBA_DI_TKP' && c.tahap !== 4) {
        complaintAnomalies.push({
          id: c.id.toString(),
          nomor_tiket: c.nomor_tiket,
          status: c.status,
          tahap: c.tahap,
          expected_tahap: 4,
          issue: 'Status TIBA_DI_TKP tetapi tahap bukan 4',
        });
      }
    }

    // Execute Fix if requested
    let fixedAuditLogsCount = 0;
    let fixedDispatchesCount = 0;

    if (shouldFix) {
      if (logsToFixIds.length > 0) {
        const res = await (prisma as any).complaintAuditLog.updateMany({
          where: { id: { in: logsToFixIds } },
          data: { actor_role: 'PERSONIL' },
        });
        fixedAuditLogsCount = res.count;
      }

      for (const dFix of dispatchesToFixDeparted) {
        await (prisma as any).complaintDispatch.update({
          where: { id: dFix.id },
          data: { departed_at: dFix.departed_at },
        });
        fixedDispatchesCount++;
      }
    }

    // 4. Audit Users & Police Officers role consistency
    const allUsers = await (prisma as any).user.findMany({
      include: { officer_profile: true },
    });

    const userOfficerAnomalies: any[] = [];
    for (const u of allUsers) {
      const officer = u.officer_profile;
      if (u.role === 'PAWAS' && officer) {
        const rank = (officer.rank_pangkat || '').toUpperCase();
        if (rank.includes('BRIPKA') || rank.includes('BRIPTU') || rank.includes('BRIPDA') || rank.includes('BRIGADIR') || rank.includes('BHARADA')) {
          userOfficerAnomalies.push({
            userId: u.id.toString(),
            name: u.full_name,
            user_role: u.role,
            officer_rank: officer.rank_pangkat,
            nrp: officer.nrp,
            issue: 'User role adalah PAWAS tetapi pangkatnya Bintara/Personel Lapangan',
          });
        }
      } else if (u.role === 'PERSONIL' && officer) {
        const rank = (officer.rank_pangkat || '').toUpperCase();
        if (rank.includes('AKP') || rank.includes('KOMPOL') || rank.includes('AKBP')) {
          userOfficerAnomalies.push({
            userId: u.id.toString(),
            name: u.full_name,
            user_role: u.role,
            officer_rank: officer.rank_pangkat,
            nrp: officer.nrp,
            issue: 'User role adalah PERSONIL tetapi pangkatnya Perwira Menengah/Pawas',
          });
        }
      }
    }

    // 5. Audit Patrol Vehicles
    const allVehicles = await (prisma as any).patrolVehicle.findMany();
    const vehicleAnomalies: any[] = [];
    for (const v of allVehicles) {
      if (!v.plat_nomor || !v.call_sign) {
        vehicleAnomalies.push({
          id: v.id,
          issue: 'Kendaraan patroli tidak memiliki plat nomor atau call sign lengkap',
        });
      }
    }

    return NextResponse.json({
      success: true,
      isFixed: shouldFix,
      rawAuditLogs: allAuditLogs.map((l: any) => ({
        id: l.id.toString(),
        actor_name: l.actor_name,
        actor_role: l.actor_role,
        action: l.action,
        created_at: l.created_at,
      })),
      summary: {
        totalUsers: allUsers.length,
        userOfficerAnomaliesCount: userOfficerAnomalies.length,
        totalAuditLogs: allAuditLogs.length,
        auditLogAnomaliesCount: auditLogAnomalies.length,
        totalDispatches: allDispatches.length,
        dispatchAnomaliesCount: dispatchAnomalies.length,
        totalComplaints: allComplaints.length,
        complaintAnomaliesCount: complaintAnomalies.length,
        totalVehicles: allVehicles.length,
        vehicleAnomaliesCount: vehicleAnomalies.length,
      },
      details: {
        auditLogAnomalies,
        userOfficerAnomalies,
        dispatchAnomalies,
        complaintAnomalies,
        vehicleAnomalies,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
