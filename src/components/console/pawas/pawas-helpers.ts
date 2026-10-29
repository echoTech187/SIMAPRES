import { PawasTab } from './types';

export function parsePawasTab(tabOrSection?: string | null): PawasTab {
  const t = tabOrSection ? tabOrSection.toLowerCase().trim() : '';
  switch (t) {
    case 'peta':
    case 'map':
    case 'tactical-map':
      return 'view-peta';
    case 'komando':
    case 'komando-pawas':
    case 'validasi':
      return 'view-validasi';
    case 'kinerja':
    case 'laporan':
      return 'view-laporan';
    case 'profil':
      return 'view-profil';
    case 'buat-pengaduan':
    case 'buat-log':
    case 'log':
      return 'view-log';
    case 'tolak':
      return 'view-tolak';
    case 'panduan':
    case 'faq':
    case 'sop':
      return 'view-panduan';
    case 'piket':
    case 'jadwal-piket':
    case 'piket-jaga':
      return 'view-piket';
    case 'beranda':
    default:
      return 'view-beranda';
  }
}

export function pawasTabToSlug(tabId: string): string {
  switch (tabId) {
    case 'view-peta':
      return 'peta';
    case 'view-validasi':
      return 'komando';
    case 'view-laporan':
      return 'kinerja';
    case 'view-profil':
      return 'profil';
    case 'view-operator':
      return 'operator';
    case 'view-log':
      return 'buat-pengaduan';
    case 'view-tolak':
      return 'tolak';
    case 'view-panduan':
      return 'panduan';
    case 'view-piket':
      return 'piket';
    case 'view-beranda':
    default:
      return '';
  }
}
