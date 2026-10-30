export const RATING_CRITERIA = [
  {
    id: 'responseTime',
    number: '1',
    title: 'Kecepatan Waktu Tanggap (Response Time)',
    question: 'Seberapa puas Anda dengan kecepatan respon dan waktu kedatangan petugas Polri di lokasi setelah laporan dibuat?',
    tagLabel: 'Respon',
  },
  {
    id: 'humanis',
    number: '2',
    title: 'Sikap & Keramahan Petugas (Humanis)',
    question: 'Bagaimana penilaian Anda terhadap keramahan, kesopanan, dan sikap humanis petugas saat melayani Anda?',
    tagLabel: 'Humanis',
  },
  {
    id: 'transparansi',
    number: '3',
    title: 'Kejelasan Informasi & Transparansi',
    question: 'Seberapa jelas petunjuk, penanganan awal, atau informasi yang diberikan oleh petugas/sistem terkait laporan Anda?',
    tagLabel: 'Transparansi',
  },
  {
    id: 'policeCare',
    number: '4',
    title: 'Rasa Aman & Kehadiran Polri (Police Care)',
    question: 'Apakah kehadiran dan tindakan petugas di lapangan memberikan rasa aman dan bantuan yang Anda butuhkan?',
    tagLabel: 'Police Care',
  },
  {
    id: 'overall',
    number: '5',
    title: 'Kepuasan Pelayanan Secara Keseluruhan (Overall Satisfaction)',
    question: 'Secara keseluruhan, seberapa puas Anda terhadap kualitas pelayanan kepolisian melalui sistem SIMOPMAS 110 ini?',
    tagLabel: 'Overall',
  },
];

export const RATING_LABELS: Record<number, string> = {
  1: 'Sangat Kecewa',
  2: 'Kurang Puas',
  3: 'Cukup',
  4: 'Puas',
  5: 'Sangat Puas',
};

export interface CitizenLiveRadarTrackerProps {
  nomorTiket: string;
  initialData?: any;
  onBack?: () => void;
  token?: string;
  onSwitchToOperatorReview?: () => void;
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return Number((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
}
