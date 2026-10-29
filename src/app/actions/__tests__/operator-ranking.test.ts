import { describe, it, expect } from 'vitest';

/**
 * Formula Resmi Penilaian Operator SPKT 110 (Opsi 1)
 */
function calculateOperatorScore(params: {
  totalTiketInput: number;
  validRate: number; // 0 - 100%
  sopComplianceRate: number; // 0 - 100%
  avgRating: number; // 0 - 5.0
}) {
  const { totalTiketInput, validRate, sopComplianceRate, avgRating } = params;

  if (totalTiketInput === 0) {
    return {
      compositeScore: 0,
      predikat: 'Siaga (Belum Ada Tiket)',
      predikatColor: '#64748B',
    };
  }

  // 1. Produktivitas Input (40 Poin) - 1 tiket = 8 pts, >= 5 tiket = 40 pts
  const volumeScore = Math.min(40, totalTiketInput * 8);
  // 2. Kerapian & Kepatuhan SOP Input Data (30 Poin)
  const sopScore = Math.round((sopComplianceRate / 100) * 30);
  // 3. Validitas & Penyaluran Tiket (15 Poin)
  const validScore = Math.round((validRate / 100) * 15);
  // 4. Rating Kepuasan Warga (15 Poin)
  const ratingScore = avgRating > 0 ? Math.round((avgRating / 5) * 15) : 12;

  const compositeScore = Math.min(100, Math.round(volumeScore + sopScore + validScore + ratingScore));

  let predikat = 'Siaga (Belum Ada Tiket)';
  let predikatColor = '#64748B';

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

  return { compositeScore, predikat, predikatColor };
}

describe('Operator SPKT 110 Ranking (Option 1 Formula)', () => {
  it('awards Teladan (score >= 90) to highly productive and compliant operators', () => {
    const result = calculateOperatorScore({
      totalTiketInput: 10,
      validRate: 100,
      sopComplianceRate: 100,
      avgRating: 5.0,
    });

    expect(result.compositeScore).toBe(100);
    expect(result.predikat).toBe('Operator Teladan 110');
    expect(result.predikatColor).toBe('#059669');
  });

  it('awards Pelayanan Baik (75-89 pts) to standard competent operators', () => {
    const result = calculateOperatorScore({
      totalTiketInput: 4, // 32 pts
      validRate: 100, // 15 pts
      sopComplianceRate: 80, // 24 pts
      avgRating: 4.0, // 12 pts
    });

    // 32 + 24 + 15 + 12 = 83 pts
    expect(result.compositeScore).toBe(83);
    expect(result.predikat).toBe('Pelayanan Baik');
    expect(result.predikatColor).toBe('#2563EB');
  });

  it('marks operator with 0 tickets as Siaga (Belum Ada Tiket)', () => {
    const result = calculateOperatorScore({
      totalTiketInput: 0,
      validRate: 100,
      sopComplianceRate: 100,
      avgRating: 0,
    });

    expect(result.compositeScore).toBe(0);
    expect(result.predikat).toBe('Siaga (Belum Ada Tiket)');
  });

  it('marks low performance or sloppy input (< 60 pts) as Perlu Evaluasi SOP', () => {
    const result = calculateOperatorScore({
      totalTiketInput: 1, // 8 pts
      validRate: 50, // 8 pts
      sopComplianceRate: 30, // 9 pts
      avgRating: 2.0, // 6 pts
    });

    // 8 + 8 + 9 + 6 = 31 pts
    expect(result.compositeScore).toBeLessThan(60);
    expect(result.predikat).toBe('Perlu Evaluasi SOP');
    expect(result.predikatColor).toBe('#DC2626');
  });
});
