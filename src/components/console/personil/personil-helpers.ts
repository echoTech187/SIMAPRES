import type { PersonilTab } from './types';

export function parsePersonilTab(section?: string): PersonilTab {
  if (!section) return 'beranda';
  const clean = section.toLowerCase().trim();
  switch (clean) {
    case 'peta':
    case 'maps':
      return 'peta';
    case 'profil':
    case 'profile':
    case 'kinerja':
    case 'laporan':
      return 'profil';
    case 'beranda':
    default:
      return 'beranda';
  }
}

export function personilTabToSlug(tabId: PersonilTab): string {
  switch (tabId) {
    case 'peta':
      return 'peta';
    case 'profil':
      return 'profil';
    case 'beranda':
    default:
      return '';
  }
}

// Audio alert sirine patwal MP3 looping untuk penugasan darurat
let personilAlertAudioInstance: HTMLAudioElement | null = null;

export function playPoliceAlertAudio() {
  try {
    if (typeof window === 'undefined') return;
    if (!personilAlertAudioInstance) {
      personilAlertAudioInstance = new Audio('/audio/nada_dering_suara_mobil_patwal_viral_tiktok.mp3');
      personilAlertAudioInstance.loop = true;
      personilAlertAudioInstance.preload = 'auto';
    }
    personilAlertAudioInstance.currentTime = 0;
    personilAlertAudioInstance.play().catch(() => {});
  } catch (_) {}
}

export function stopPoliceAlertAudio() {
  try {
    if (personilAlertAudioInstance) {
      personilAlertAudioInstance.pause();
      personilAlertAudioInstance.currentTime = 0;
    }
  } catch (_) {}
}
