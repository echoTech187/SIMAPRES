// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { formatAutoCompletedPatrolDescription } from '@/domain/rules/complaint.rules';

describe('Domain Rules: Penyelesaian Otomatis Giat Patroli saat Terima Modal Tiket 110', () => {
  it('harus memformat stempel penyelesaian otomatis dengan nomor tiket dan waktu saat giat sebelumnya memiliki deskripsi', () => {
    const existingDesc = 'Patroli blue light beat pemantauan jalur pantura kajen.';
    const ticketNo = 'TICKET-1826127457';

    const result = formatAutoCompletedPatrolDescription(existingDesc, ticketNo);

    expect(result).toContain(existingDesc);
    expect(result).toContain('[SELESAI OTOMATIS: Dialihkan ke Penanganan Tiket Darurat 110 #TICKET-1826127457');
    expect(result).toContain('WIB]');
  });

  it('harus membuat stempel penyelesaian otomatis meskipun deskripsi awal giat kosong', () => {
    const existingDesc = '';
    const ticketNo = 'TICKET-9999999999';

    const result = formatAutoCompletedPatrolDescription(existingDesc, ticketNo);

    expect(result).toContain('[SELESAI OTOMATIS: Dialihkan ke Penanganan Tiket Darurat 110 #TICKET-9999999999');
  });
});

