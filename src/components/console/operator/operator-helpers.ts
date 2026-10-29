import { PawasTab } from '../pawas/types';

export function parseOperatorTab(section: string): PawasTab {
  switch (section) {
    case 'peta':
      return 'view-peta';
    case 'panduan':
    case 'faq':
      return 'view-panduan';
    case 'kinerja':
    case 'laporan':
    case 'peringkat':
      return 'view-laporan';
    case 'profil':
      return 'view-profil';
    case 'tolak':
      return 'view-tolak';
    case 'operator':
    default:
      return 'view-operator';
  }
}

export function operatorTabToSlug(tabId: PawasTab): string {
  switch (tabId) {
    case 'view-peta':
      return 'peta';
    case 'view-panduan':
      return 'panduan';
    case 'view-laporan':
      return 'kinerja';
    case 'view-profil':
      return 'profil';
    case 'view-tolak':
      return 'tolak';
    case 'view-operator':
    default:
      return '';
  }
}
