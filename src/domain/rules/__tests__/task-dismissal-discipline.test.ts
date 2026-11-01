// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import {
  calculateKpiIgnorePenalty,
  calculateKpiIgnoreReset,
  KPI_PENALTY_DISPATCH_IGNORE,
  KPI_LOW_SCORE_WARNING_THRESHOLD,
} from '@/domain/rules/complaint.rules';

describe('Domain Rules: Tata Tertib Pengabaian Penugasan Personel Lapangan (Task Dismissal)', () => {
  it('harus memotong -10 poin KPI ketika personel mengabaikan penugasan pertama kali', () => {
    const initialKpi = 100;
    const result = calculateKpiIgnorePenalty(initialKpi);

    expect(result.currentKpiScore).toBe(100);
    expect(result.scoreDelta).toBe(-10);
    expect(result.newKpiScore).toBe(90);
    expect(result.isWarningPawasTriggered).toBe(false);
  });

  it('harus memicu isWarningPawasTriggered ketika poin akumulasi turun di bawah ambang batas (< 10 poin)', () => {
    // Skor awal 15 poin, setelah dipotong 10 menjadi 5 poin (< 10)
    const lowKpi = 15;
    const result = calculateKpiIgnorePenalty(lowKpi);

    expect(result.newKpiScore).toBe(5);
    expect(result.isWarningPawasTriggered).toBe(true);
  });

  it('tidak boleh menghasilkan poin negatif (skor minimum adalah 0)', () => {
    const criticalKpi = 5;
    const result = calculateKpiIgnorePenalty(criticalKpi);

    expect(result.newKpiScore).toBe(0);
    expect(result.isWarningPawasTriggered).toBe(true);
  });

  it('harus memulihkan / me-reset +10 poin saat tiket yang sempat diabaikan dijalankan hingga selesai', () => {
    const penalizedKpi = 5;
    const resetResult = calculateKpiIgnoreReset(penalizedKpi);

    expect(resetResult.scoreDelta).toBe(10);
    expect(resetResult.newKpiScore).toBe(15);
    expect(resetResult.isWarningPawasTriggered).toBe(false);
  });

  it('skor pemulihan tidak boleh melebihi batas maksimum 100 poin', () => {
    const nearMaxKpi = 95;
    const resetResult = calculateKpiIgnoreReset(nearMaxKpi);

    expect(resetResult.newKpiScore).toBe(100);
  });
});

