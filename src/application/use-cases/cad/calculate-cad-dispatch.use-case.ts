import { HaversineService } from '@/infrastructure/services/haversine.service';
import { IOfficerRepository } from '@/domain/repositories/officer.repository.interface';

export interface CadDispatchRecommendation {
  officerId: bigint;
  nrp: string;
  nama: string;
  pangkat: string;
  satuan: string;
  vehicle: string;
  jarakKm: number;
  etaMenit: number;
  isSlaAman: boolean; // eta <= 15
  isPrimarySop: boolean;
  sopAlasan: string;
}

export class CalculateCadDispatchUseCase {
  constructor(private officerRepo: IOfficerRepository) {}

  async execute(
    incidentText: string,
    incidentLat: number,
    incidentLng: number
  ): Promise<CadDispatchRecommendation[]> {
    const text = incidentText.toLowerCase();

    // 1. Klasifikasi SOP Tupoksi Satuan Polri
    let primarySatuan = 'sabhara';
    let alasanSop = 'SOP Sat Samapta / Sabhara Presisi (Utama) untuk respon cepat & sterilisasi TKP.';

    if (
      text.includes('laka') ||
      text.includes('tabrakan') ||
      text.includes('macet') ||
      text.includes('lalu lintas') ||
      text.includes('balap liar')
    ) {
      primarySatuan = 'lantas';
      alasanSop = 'SOP Satuan Lalu Lintas (Utama) untuk evakuasi laka & penguraian arus lalu lintas.';
    } else if (
      text.includes('curanmor') ||
      text.includes('curas') ||
      text.includes('curat') ||
      text.includes('pencuri') ||
      text.includes('begal') ||
      text.includes('sajam') ||
      text.includes('senjata') ||
      text.includes('narkoba')
    ) {
      primarySatuan = 'reskrim';
      alasanSop = 'SOP Sat Reskrim (Utama) didukung Samapta untuk olah TKP Inafis & gakkum.';
    } else if (
      text.includes('mediasi') ||
      text.includes('sengketa') ||
      text.includes('anak hilang') ||
      text.includes('tetangga') ||
      text.includes('bansos')
    ) {
      primarySatuan = 'binmas';
      alasanSop = 'SOP Sat Binmas (Bhabinkamtibmas) untuk mediasi damai & problem solving warga.';
    }

    // 2. Ambil Personel Siaga Aktif
    const activeOfficers = await this.officerRepo.findActiveOnDuty();

    // 3. Hitung Jarak & ETA
    const recommendations: CadDispatchRecommendation[] = [];

    for (const officer of activeOfficers) {
      const offLat = officer.currentGpsLat || -6.2415;
      const offLng = officer.currentGpsLng || 106.8021;

      const jarakKm = HaversineService.calculateDistanceKm(
        incidentLat,
        incidentLng,
        offLat,
        offLng
      );

      // Asumsi kecepatan rata-rata kendaraan patroli kota 30 km/jam = 0.5 km/menit
      const etaMenit = Math.max(2, Math.round((jarakKm / 30) * 60));
      const isPrimarySop = officer.jabatan.toLowerCase().includes(primarySatuan) ||
        (officer.assignedPatrolVehicle || '').toLowerCase().includes(primarySatuan);

      recommendations.push({
        officerId: officer.id!,
        nrp: officer.nrp,
        nama: officer.jabatan,
        pangkat: officer.rankPangkat,
        satuan: primarySatuan.toUpperCase(),
        vehicle: officer.assignedPatrolVehicle || 'Patroli Presisi',
        jarakKm,
        etaMenit,
        isSlaAman: etaMenit <= 15,
        isPrimarySop,
        sopAlasan: isPrimarySop ? alasanSop : 'Satuan pendukung pengamanan perimeter.',
      });
    }

    // Urutkan: Satuan Utama SOP lebih dulu, lalu jarak terdekat
    return recommendations.sort((a, b) => {
      if (a.isPrimarySop && !b.isPrimarySop) return -1;
      if (!a.isPrimarySop && b.isPrimarySop) return 1;
      return a.jarakKm - b.jarakKm;
    });
  }
}
