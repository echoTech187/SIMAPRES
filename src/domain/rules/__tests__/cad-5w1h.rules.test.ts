import { describe, it, expect } from 'vitest';
import { evaluate5W1HHeuristic } from '../cad-5w1h.rules';

describe('CAD 5W+1H Domain Rules', () => {
  it('harus menilai narasi lengkap dengan skor tinggi', () => {
    const res = evaluate5W1HHeuristic({
      ringkasanKeterangan: 'Terjadi kecelakaan tabrak lari di depan Pasar Bojong pukul 14.00 WIB antara motor dan mobil, korban luka berdarah di kepala.',
      subkasusNama: 'Kasus kecelakaan tabrak lari',
      tkpAlamat: 'Pasar Bojong, Jl. Raya Bojong',
      hasGps: true,
      pelaporNama: 'Budi Santoso',
      pelaporHp: '081234567890',
    });

    expect(res.hasWhat).toBe(true);
    expect(res.hasWho).toBe(true);
    expect(res.hasWhere).toBe(true);
    expect(res.hasWhen).toBe(true);
    expect(res.isSubcategoryAligned).toBe(true);
    expect(res.score).toBeGreaterThanOrEqual(85);
  });

  it('harus mendeteksi kekurangan unsur jika narasi terlalu singkat', () => {
    const res = evaluate5W1HHeuristic({
      ringkasanKeterangan: 'ada tawuran',
      subkasusNama: 'Tawuran antar pelajar atau kelompok warga',
    });

    expect(res.hasWhat).toBe(true);
    expect(res.hasWhere).toBe(false);
    expect(res.hasWhen).toBe(false);
    expect(res.score).toBeLessThan(60);
    expect(res.internalEvaluationNotes).toContain('Catatan Evaluasi Kedinasan');
  });
});

