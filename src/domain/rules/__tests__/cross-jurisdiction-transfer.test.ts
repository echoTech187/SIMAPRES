import { describe, it, expect } from 'vitest';

/**
 * Logika penentuan apakah disposisi merupakan 'penarikan kembali ke Mako Asal' atau 'disposisi lintas wilayah'.
 */
function evaluateTransferType(input: {
  targetStationId: number;
  callerStationId: number | null;
  transferReason?: string;
}): { isReturningToMakoAsal: boolean; targetStatus: string; auditAction: string } {
  const isExplicitRecall = Boolean(
    input.transferReason && input.transferReason.toLowerCase().includes('penarikan kembali ke mako asal')
  );
  const isReturningToMakoAsal =
    isExplicitRecall && input.callerStationId !== null && Number(input.targetStationId) === input.callerStationId;

  return {
    isReturningToMakoAsal,
    targetStatus: isReturningToMakoAsal ? 'MENUNGGU' : 'DISPOSISI_LINTAS_WILAYAH',
    auditAction: isReturningToMakoAsal ? 'PENARIKAN_KEMBALI_MAKO_ASAL' : 'DISPOSISI_LINTAS_WILAYAH',
  };
}

describe('Cross Jurisdiction Transfer Logic & Escalation Safety', () => {
  it('harus mengenali disposisi baru dari Polsek ke Polres Pekalongan (60001) sebagai DISPOSISI_LINTAS_WILAYAH, bukan penarikan mandiri', () => {
    const result = evaluateTransferType({
      targetStationId: 60001, // Polres Pekalongan
      callerStationId: 90001, // Operator dari Polsek Pekalongan Kota/Barat
      transferReason: 'Deteksi koordinat TKP berada di luar batas wilayah operasional.',
    });

    expect(result.isReturningToMakoAsal).toBe(false);
    expect(result.targetStatus).toBe('DISPOSISI_LINTAS_WILAYAH');
    expect(result.auditAction).toBe('DISPOSISI_LINTAS_WILAYAH');
  });

  it('harus mengenali penarikan kembali ke Mako Asal jika operator Mako Asal sendiri yang secara eksplisit menarik kembali tiket', () => {
    const result = evaluateTransferType({
      targetStationId: 60001,
      callerStationId: 60001, // Operator Polres Pekalongan sendiri
      transferReason: 'Penarikan Kembali ke Mako Asal (Polres Pekalongan): Karena Mako yurisdiksi sebelumnya tidak merespon.',
    });

    expect(result.isReturningToMakoAsal).toBe(true);
    expect(result.targetStatus).toBe('MENUNGGU');
    expect(result.auditAction).toBe('PENARIKAN_KEMBALI_MAKO_ASAL');
  });

  it('tidak boleh mengaktifkan isReturningToMakoAsal jika alasan tidak eksplisit penarikan kembali kendati stasiun sama', () => {
    const result = evaluateTransferType({
      targetStationId: 60001,
      callerStationId: 60001,
      transferReason: 'Disposisi ulang ke Mako.',
    });

    expect(result.isReturningToMakoAsal).toBe(false);
    expect(result.targetStatus).toBe('DISPOSISI_LINTAS_WILAYAH');
    expect(result.auditAction).toBe('DISPOSISI_LINTAS_WILAYAH');
  });
});

