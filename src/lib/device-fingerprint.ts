/**
 * SIMAPRES 110 - Device Fingerprint & Hardware Identity Helper
 * Digunakan untuk identifikasi unik perangkat fisik smartphone patroli
 */

export function getClientDeviceBrand(): string {
  if (typeof window === 'undefined') return 'Mobile Terminal';

  try {
    const storedBrand = localStorage.getItem('simopmas_device_brand_name');
    if (storedBrand) return storedBrand;

    const ua = navigator.userAgent;
    let brand = 'Smartphone Presisi';
    if (/iPhone/i.test(ua)) brand = 'Apple iPhone';
    else if (/Samsung/i.test(ua)) brand = 'Samsung Galaxy';
    else if (/Xiaomi|Redmi|POCO/i.test(ua)) brand = 'Xiaomi / Redmi';
    else if (/Oppo/i.test(ua)) brand = 'Oppo Mobile';
    else if (/Vivo/i.test(ua)) brand = 'Vivo Mobile';
    else if (/Realme/i.test(ua)) brand = 'Realme Mobile';
    else if (/Android/i.test(ua)) brand = 'Android Smartphone';
    else brand = 'Mobile Terminal';

    localStorage.setItem('simopmas_device_brand_name', brand);
    return brand;
  } catch (_e) {
    return 'Mobile Terminal';
  }
}

export function getOrCreateClientDeviceId(): string {
  if (typeof window === 'undefined') return '';

  try {
    const storedHwId = localStorage.getItem('simopmas_hardware_device_id');
    if (storedHwId && storedHwId.trim()) {
      return storedHwId.trim();
    }

    const ua = navigator.userAgent;
    const screenRes = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const cores = navigator.hardwareConcurrency || 4;
    const mem = (navigator as any).deviceMemory || 4;
    const lang = navigator.language || 'id-ID';
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta';

    let gpuVendor = 'GENERIC-GPU';
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          gpuVendor = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'MALI-ADRENO';
        }
      }
    } catch (_e) {
      gpuVendor = 'EMBEDDED-GPU';
    }

    const rawEntropy = `${ua}_${screenRes}_${cores}_${mem}_${lang}_${timezone}_${gpuVendor}`;
    let hash = 0;
    for (let i = 0; i < rawEntropy.length; i++) {
      hash = (hash << 5) - hash + rawEntropy.charCodeAt(i);
      hash |= 0;
    }

    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0').slice(-8);
    const generatedId = `DEV-HP-${hex}`;

    localStorage.setItem('simopmas_hardware_device_id', generatedId);
    getClientDeviceBrand();

    return generatedId;
  } catch (_e) {
    return '';
  }
}
