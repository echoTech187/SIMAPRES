import { describe, it, expect } from 'vitest';
import { ComplaintEntity } from '../complaint.entity';

describe('ComplaintEntity Domain Methods & PDP Compliance', () => {
  const createBaseComplaint = (): ComplaintEntity =>
    new ComplaintEntity({
      id: BigInt(777),
      nomorTiket: 'TICKET-20261030-777',
      pelaporNama: 'Raden Mas Danang',
      pelaporHp: '081234567890',
      jenisKejadian: 'GANGGUAN_KAMTIBMAS',
      urgensi: 'DARURAT',
      tkpAlamatTeks: 'Depan Pasar Kedungwuni',
      tkpLat: -6.980,
      tkpLng: 109.650,
      ringkasanKeterangan: 'Ada keributan di depan pasar',
      status: 'MENUNGGU',
      tahap: 1,
    });

  describe('Citizen Privacy Protection (UU PDP No. 27/2022)', () => {
    it('masks the middle 4 digits of citizen phone number', () => {
      const complaint = createBaseComplaint();
      // '081234567890' -> slice(0,4) + '****' + slice(-4) = '0812****7890'
      expect(complaint.maskedPelaporHp).toBe('0812****7890');
    });

    it('returns **** for unusually short phone numbers (< 8 chars)', () => {
      const shortComplaint = new ComplaintEntity({
        nomorTiket: 'TICKET-001',
        pelaporNama: 'Anonim',
        pelaporHp: '110',
        jenisKejadian: 'INFO',
        urgensi: 'NORMAL',
        tkpAlamatTeks: 'Alamat',
        tkpLat: 0,
        tkpLng: 0,
        ringkasanKeterangan: 'Keterangan pengaduan',
        status: 'MENUNGGU',
      });
      expect(shortComplaint.maskedPelaporHp).toBe('****');
    });
  });

  describe('Field Step Transitions & Audit Timelines', () => {
    it('advances to tahap 3 (Meluncur) and logs timeline step', () => {
      const complaint = createBaseComplaint();
      expect(complaint.tahap).toBe(1);

      // 1. Pawas melakukan disposisi ke petugas lapangan
      complaint.disposisiKePetugas(BigInt(88), BigInt(99));
      expect(complaint.status).toBe('DIPROSES');

      // 2. Petugas mengonfirmasi meluncur
      complaint.personilMeluncur('Unit patroli bergerak cepat', 'https://foto.jpg', -6.981, 109.651);

      expect(complaint.status).toBe('DIPROSES');
      expect(complaint.tahap).toBe(3);
      expect(complaint.timelines.length).toBeGreaterThan(0);

      const latest = complaint.timelines[complaint.timelines.length - 1];
      expect(latest.actionKey).toBe('OFFICER_DEPARTED');
      expect(latest.catatan).toBe('Unit patroli bergerak cepat');
    });

    it('advances to tahap 4 (Tiba di TKP) with GPS discrepancy audit', () => {
      const complaint = createBaseComplaint();
      complaint.disposisiKePetugas(BigInt(88), BigInt(99));
      complaint.personilMeluncur('Meluncur ke lokasi');

      complaint.tibaDiTkp(
        'Tiba di TKP Pasar',
        'https://foto-tkp.jpg',
        -6.985,
        109.655,
        true, // Discrepancy
        650, // 650 meters
        'Peringatan: Deviasi 650m dari titik pelapor'
      );

      expect(complaint.status).toBe('DIPROSES');
      expect(complaint.tahap).toBe(4);

      const latest = complaint.timelines[complaint.timelines.length - 1];
      expect(latest.actionKey).toBe('DOKUMENTASI_TKP_FLAGGED');
      expect(latest.isDiscrepancy).toBe(true);
      expect(latest.deviationMeters).toBe(650);
      expect(latest.warningMessage).toContain('650m');
    });

    it('advances to tahap 5 (Menunggu Pengesahan BAP) via ajukanPengesahanBap', () => {
      const complaint = createBaseComplaint();
      complaint.disposisiKePetugas(BigInt(88), BigInt(99));
      complaint.personilMeluncur('Meluncur ke lokasi');
      complaint.tibaDiTkp('Tiba di TKP');

      complaint.ajukanPengesahanBap('Penanganan selesai dan mediasi para pihak', 'https://bap.jpg');

      expect(complaint.status).toBe('MENUNGGU_PENGESAHAN');
      expect(complaint.tahap).toBe(5);

      const latest = complaint.timelines[complaint.timelines.length - 1];
      expect(latest.actionKey).toBe('REPORT_SUBMITTED');
    });

    it('directly closes case to SELESAI when resolved on spot by commander', () => {
      const complaint = createBaseComplaint();
      complaint.selesaikanKasusLangsung('Diselesaikan langsung di lokasi kejadian');

      expect(complaint.status).toBe('SELESAI');
      expect(complaint.tahap).toBe(5);

      const latest = complaint.timelines[complaint.timelines.length - 1];
      expect(latest.actionKey).toBe('REPORT_SUBMITTED');
    });

    it('completes complaint when validated by Pawas and accepts citizen rating', () => {
      const complaint = createBaseComplaint();
      complaint.selesaikanKasus('Disahkan oleh Pawas');

      expect(complaint.status).toBe('SELESAI');
      expect(complaint.tahap).toBe(5);

      const latest = complaint.timelines[complaint.timelines.length - 1];
      expect(latest.actionKey).toBe('COMPLAINT_COMPLETED');

      complaint.berikanRatingWarga(5, 'Pelayanan cepat dan transparan', 'Ramah,Cepat');
      expect(complaint.citizenRating).toBe(5);
      expect(complaint.citizenReview).toBe('Pelayanan cepat dan transparan');
    });
  });
});
