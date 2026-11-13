import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/infrastructure/db/prisma.client';
import { generateTrackingToken } from '@/lib/tracking-token';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

interface FivePointsFeedback {
  point1: number | null; // Kecepatan Respon
  point2: number | null; // Sikap Humanis
  point3: number | null; // Transparansi Informasi
  point4: number | null; // Police Care / Tuntas Solutif
  point5: number | null; // Overall Kepuasan
  totalScore: number | null; // Jumlah Total Skor (5 - 25)
  averageScore: number | null; // Nilai Rata-rata (1 - 5)
  reviewText: string;
  sourceType: 'WARGA_LAPANGAN' | 'OPERATOR_110' | 'BELUM_ADA';
}

function parseFivePoints(feedbackTags: string | null | undefined, starRating: number | null | undefined, reviewText: string | null | undefined): FivePointsFeedback {
  const result: FivePointsFeedback = {
    point1: null,
    point2: null,
    point3: null,
    point4: null,
    point5: null,
    totalScore: null,
    averageScore: null,
    reviewText: reviewText?.trim() || '-',
    sourceType: 'BELUM_ADA',
  };

  if (!feedbackTags && !starRating) {
    return result;
  }

  const tags = feedbackTags || '';
  const isOperator = tags.includes('[Skor Operator:');

  if (isOperator) {
    result.sourceType = 'OPERATOR_110';
    // Format: "[Skor Operator: 5★] | Respon Cepat: 5★, Ramah & Sopan: 5★, Informasi Jelas: 5★, Tuntas Solutif: 5★, Overall Prima: 5★"
    const m1 = tags.match(/Respon Cepat:\s*(\d+)★/);
    const m2 = tags.match(/Ramah & Sopan:\s*(\d+)★/);
    const m3 = tags.match(/Informasi Jelas:\s*(\d+)★/);
    const m4 = tags.match(/Tuntas Solutif:\s*(\d+)★/);
    const m5 = tags.match(/Overall Prima:\s*(\d+)★/);

    if (m1) result.point1 = parseInt(m1[1], 10);
    if (m2) result.point2 = parseInt(m2[1], 10);
    if (m3) result.point3 = parseInt(m3[1], 10);
    if (m4) result.point4 = parseInt(m4[1], 10);
    if (m5) result.point5 = parseInt(m5[1], 10);
  } else {
    // Format Lapangan Warga: "Respon: 5★, Humanis: 4★, Transparansi: 4★, Police Care: 5★, Overall: 4★"
    const m1 = tags.match(/Respon:\s*(\d+)★/);
    const m2 = tags.match(/Humanis:\s*(\d+)★/);
    const m3 = tags.match(/Transparansi:\s*(\d+)★/);
    const m4 = tags.match(/Police Care:\s*(\d+)★/);
    const m5 = tags.match(/Overall:\s*(\d+)★/);

    if (m1 || m2 || m3 || m4 || m5) {
      result.sourceType = 'WARGA_LAPANGAN';
      if (m1) result.point1 = parseInt(m1[1], 10);
      if (m2) result.point2 = parseInt(m2[1], 10);
      if (m3) result.point3 = parseInt(m3[1], 10);
      if (m4) result.point4 = parseInt(m4[1], 10);
      if (m5) result.point5 = parseInt(m5[1], 10);
    }
  }

  // Fallback jika tags tidak lengkap tapi ada starRating
  if (result.point1 === null && starRating) {
    result.point1 = starRating;
    result.point2 = starRating;
    result.point3 = starRating;
    result.point4 = starRating;
    result.point5 = starRating;
    result.sourceType = result.sourceType === 'BELUM_ADA' ? 'WARGA_LAPANGAN' : result.sourceType;
  }

  const values = [result.point1, result.point2, result.point3, result.point4, result.point5].filter(
    (v): v is number => typeof v === 'number' && !isNaN(v)
  );

  if (values.length > 0) {
    const sum = values.reduce((a, b) => a + b, 0);
    result.totalScore = sum;
    result.averageScore = Math.round((sum / values.length) * 10) / 10;
  } else if (starRating) {
    result.averageScore = starRating;
    result.totalScore = starRating * 5;
  }

  return result;
}

export async function GET(request: NextRequest) {
  try {
    // 1. Auth Guard Khusus Role PAWAS & SUPERADMIN
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesi kedinasan tidak valid. Silakan login kembali.' },
        { status: 401 }
      );
    }

    const userRole = String(session.role || '').toUpperCase();
    if (userRole !== 'PAWAS' && userRole !== 'SUPERADMIN') {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Fitur unduh laporan Excel hanya dapat diakses oleh Perwira Pengawas (PAWAS).' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const origin = url.origin;
    const period = url.searchParams.get('period') || 'semua'; // 'harian', 'mingguan', 'bulanan', 'semua'
    const dateParam = url.searchParams.get('date'); // YYYY-MM-DD
    const stationIdParam = url.searchParams.get('stationId');

    // 2. Query data complaint beserta relasinya
    const whereClause: any = {};

    // Filter station jika bukan superadmin atau user memilih filter mako
    if (userRole !== 'SUPERADMIN' && session.stationId) {
      whereClause.station_id = Number(session.stationId);
    } else if (stationIdParam) {
      whereClause.station_id = Number(stationIdParam);
    }

    // Filter Tanggal jika ada parameter
    if (dateParam) {
      const selectedDate = new Date(`${dateParam}T00:00:00`);
      if (!isNaN(selectedDate.getTime())) {
        if (period === 'harian') {
          const nextDay = new Date(selectedDate);
          nextDay.setDate(nextDay.getDate() + 1);
          whereClause.created_at = {
            gte: selectedDate,
            lt: nextDay,
          };
        } else if (period === 'mingguan') {
          const startDate = new Date(selectedDate);
          startDate.setDate(startDate.getDate() - 7);
          const endDate = new Date(selectedDate);
          endDate.setDate(endDate.getDate() + 1);
          whereClause.created_at = {
            gte: startDate,
            lt: endDate,
          };
        } else if (period === 'bulanan') {
          const startDate = new Date(selectedDate);
          startDate.setDate(startDate.getDate() - 30);
          const endDate = new Date(selectedDate);
          endDate.setDate(endDate.getDate() + 1);
          whereClause.created_at = {
            gte: startDate,
            lt: endDate,
          };
        }
      }
    }

    const complaints = await (prisma as any).complaint.findMany({
      where: whereClause,
      include: {
        citizen_review_rel: true,
        station: true,
        operator: true,
        dispatches: {
          include: {
            officer: {
              include: {
                user: true,
                unit: true,
              },
            },
          },
        },
      },
      orderBy: { id: 'desc' },
    });

    // 3. Bangun Workbook Excel dengan Styling Presisi Polri
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SIMAPRES Presisi 110';
    workbook.lastModifiedBy = session.fullName || session.identifier || 'Pawas Presisi';
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet('Laporan Tiket & Feedback', {
      views: [{ state: 'frozen', ySplit: 5 }],
      pageSetup: { orientation: 'landscape', paperSize: 9 },
    });

    // Judul & Header Dokumen
    const makoName = session.stationName || 'Polres Pekalongan';
    const pawasName = session.fullName ? `${session.fullName} (NRP: ${session.identifier || '-'})` : 'Perwira Pengawas (PAWAS)';
    const exportTimeWib = new Date().toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      dateStyle: 'full',
      timeStyle: 'medium',
    }) + ' WIB';

    sheet.mergeCells('A1:U1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `REKAPITULASI DOKUMEN TIKET PENGADUAN 110, PELACAKAN & EVALUASI KEPUASAN MASYARAKAT (IKM)`;
    titleCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF0F172A' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.mergeCells('A2:U2');
    const subTitleCell = sheet.getCell('A2');
    subTitleCell.value = `KESATUAN: ${makoName.toUpperCase()} • PENANGGUNG JAWAB: ${pawasName.toUpperCase()} • TANGGAL CETAK: ${exportTimeWib}`;
    subTitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
    subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.addRow([]); // Row 3 spacer

    // Row 4: Header Grup Kolom
    sheet.mergeCells('A4:J4');
    const grpDataTiket = sheet.getCell('A4');
    grpDataTiket.value = 'INFORMASI & DATA TIKET OPERASIONAL';
    grpDataTiket.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    grpDataTiket.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF153E75' } };
    grpDataTiket.alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.mergeCells('K4:L4');
    const grpTracking = sheet.getCell('K4');
    grpTracking.value = 'AUTENTIKASI & TAUTAN LACAK WARGA';
    grpTracking.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    grpTracking.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };
    grpTracking.alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.mergeCells('M4:T4');
    const grpFeedback = sheet.getCell('M4');
    grpFeedback.value = 'SURVEI KEPUASAN & EVALUASI 5 POIN (IKM PRESISI)';
    grpFeedback.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    grpFeedback.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD97706' } };
    grpFeedback.alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.mergeCells('U4:U4');
    const grpUlasan = sheet.getCell('U4');
    grpUlasan.value = 'ULASAN WARGA';
    grpUlasan.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    grpUlasan.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
    grpUlasan.alignment = { horizontal: 'center', vertical: 'middle' };

    // Row 5: Header Detail Kolom
    const headerTitles = [
      'No.',
      'Nomor Tiket',
      'Waktu Masuk',
      'Pelapor',
      'No. HP Pelapor',
      'Jenis Kejadian',
      'Urgensi',
      'Status Berkas',
      'Alamat / TKP',
      'Satuan / Petugas Respon',
      'Token Tracking',
      'Tautan Lacak Langsung (URL)',
      'Poin 1: Waktu Tanggap / Respon',
      'Poin 2: Sikap Humanis & Keramahan',
      'Poin 3: Transparansi Informasi',
      'Poin 4: Police Care / Tuntas Solutif',
      'Poin 5: Overall Kepuasan Pelayanan',
      'Total Skor (Σ 5 Poin)',
      'Nilai Rata-rata (Skala 1-5)',
      'Tipe Evaluasi',
      'Catatan / Ulasan Warga',
    ];

    const headerRow = sheet.addRow(headerTitles);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FF94A3B8' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };
    });

    // Set Column Widths
    sheet.columns = [
      { key: 'no', width: 6 },
      { key: 'nomorTiket', width: 22 },
      { key: 'waktuMasuk', width: 20 },
      { key: 'pelapor', width: 18 },
      { key: 'pelaporHp', width: 16 },
      { key: 'jenisKejadian', width: 24 },
      { key: 'urgensi', width: 12 },
      { key: 'status', width: 15 },
      { key: 'alamatTkp', width: 32 },
      { key: 'petugasRespon', width: 26 },
      { key: 'tokenTracking', width: 18 },
      { key: 'linkTracking', width: 55 },
      { key: 'point1', width: 14 },
      { key: 'point2', width: 14 },
      { key: 'point3', width: 14 },
      { key: 'point4', width: 14 },
      { key: 'point5', width: 14 },
      { key: 'totalScore', width: 14 },
      { key: 'averageScore', width: 14 },
      { key: 'sourceType', width: 18 },
      { key: 'reviewText', width: 35 },
    ];

    // 4. Masukkan Baris Data
    complaints.forEach((c: any, index: number) => {
      const ticketNo = c.nomor_tiket || `TICKET-${c.id}`;
      const token = generateTrackingToken(ticketNo);
      const trackingUrl = `${origin}/tracking?tiket=${encodeURIComponent(ticketNo)}&token=${encodeURIComponent(token)}`;

      const cDate = c.created_at ? new Date(c.created_at) : null;
      const waktuStr = cDate
        ? cDate.toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }) + ' WIB'
        : '-';

      // Satuan / Petugas Lapangan
      const primaryDisp = c.dispatches?.[0];
      const off = primaryDisp?.officer;
      const offName = off?.user?.full_name || off?.nrp || '';
      const offRank = off?.rank_pangkat || '';
      const offVehicle = off?.assigned_patrol_vehicle || '';
      const unitName = off?.unit?.short_name || off?.unit?.unit_name || '';

      let petugasStr = '-';
      if (offName || offVehicle) {
        petugasStr = [offVehicle, `${offRank} ${offName}`.trim(), unitName].filter(Boolean).join(' • ');
      }

      // Feedback 5 Poin
      const rev = c.citizen_review_rel;
      const feedback = parseFivePoints(rev?.feedback_tags, rev?.star_rating, rev?.review_text);

      const rowData = [
        index + 1,
        ticketNo,
        waktuStr,
        c.pelapor_nama || '-',
        c.pelapor_hp || '-',
        c.jenis_kejadian || '-',
        c.urgensi || 'SEDANG',
        c.status || 'MENUNGGU',
        c.tkp_alamat_teks || '-',
        petugasStr,
        token,
        trackingUrl,
        feedback.point1 !== null ? `${feedback.point1} ★` : '-',
        feedback.point2 !== null ? `${feedback.point2} ★` : '-',
        feedback.point3 !== null ? `${feedback.point3} ★` : '-',
        feedback.point4 !== null ? `${feedback.point4} ★` : '-',
        feedback.point5 !== null ? `${feedback.point5} ★` : '-',
        feedback.totalScore !== null ? feedback.totalScore : '-',
        feedback.averageScore !== null ? `${feedback.averageScore} / 5` : '-',
        feedback.sourceType === 'WARGA_LAPANGAN'
          ? 'Warga Lapangan'
          : feedback.sourceType === 'OPERATOR_110'
          ? 'Operator Call 110'
          : 'Belum Diisi',
        feedback.reviewText,
      ];

      const insertedRow = sheet.addRow(rowData);
      insertedRow.height = 22;

      // Styling Data Cells
      insertedRow.eachCell((cell, colNumber) => {
        cell.font = { name: 'Arial', size: 9 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
        cell.alignment = { vertical: 'middle' };

        // Center align untuk nomor, status, urgensi, angka, dan link
        if ([1, 2, 3, 5, 7, 8, 11, 13, 14, 15, 16, 17, 18, 19, 20].includes(colNumber)) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }

        // Tautan Tracking clickable
        if (colNumber === 12) {
          cell.value = {
            text: trackingUrl,
            hyperlink: trackingUrl,
          };
          cell.font = { name: 'Arial', size: 9, color: { argb: 'FF1D4ED8' }, underline: true };
        }

        // Skor Total & Rata-rata Highlight
        if (colNumber === 18 && typeof cell.value === 'number') {
          cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFB45309' } };
        }
        if (colNumber === 19 && String(cell.value).includes('/ 5')) {
          cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF15803D' } };
        }

        // Zebra striping
        if (index % 2 === 1) {
          if (!cell.fill || cell.fill.type !== 'pattern') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
          }
        }
      });
    });

    // 5. Generate Buffer dan Response File Excel (.xlsx)
    const buffer = await workbook.xlsx.writeBuffer();
    const dateFormatted = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `LAPORAN_TIKET_IKM_PRESISI_PAWAS_${dateFormatted}.xlsx`;

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('[EXPORT EXCEL ERROR]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengekspor berkas laporan Excel.' },
      { status: 500 }
    );
  }
}
