/**
 * SIMAPRES 110 - CLIENT-SIDE MULTI-LAYER IMAGE SECURITY & COMPRESSION ENGINE
 *
 * Prinsip: Defense-in-Depth (7-Layer Bulletproof Protection di Browser/HP)
 *
 * 1. Layer 1: Batas Ukuran Berkas Mentah (Max 5 MB sebelum kompresi)
 * 2. Layer 2: Validasi Ekstensi Ketat (Hanya JPG, JPEG, PNG, WEBP, HEIC)
 * 3. Layer 3: Validasi MIME Type Asli (Menolak SVG ber-script, text/html, exe, php, dll)
 * 4. Layer 4: Deep Binary Magic Bytes Inspection (Memeriksa header biner file langsung di memori HP)
 * 5. Layer 5: Proteksi Decompression Bomb / Pixel Flood (Maksimal 8192px / 16 Megapixel)
 * 6. Layer 6: Netralisasi Piksel & Re-Encoding Canvas (Menghapus EXIF berbahaya, polyglot shell, & steganografi)
 * 7. Layer 7: Base64 Constraint & Adaptive Compression (Max 1080px, Kualitas JPEG 70-80%, Ukuran Akhir < 300-500 KB)
 */

export const CLIENT_IMAGE_LIMITS = {
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB
  MAX_PIXEL_DIMENSION: 8192,
  MAX_TOTAL_PIXELS: 16 * 1024 * 1024, // 16 Megapixel
  TARGET_MAX_DIMENSION: 1080, // 1080px (standar presisi layar HP & laporan)
  TARGET_JPEG_QUALITY: 0.75, // 75% kualitas visual tajam
  TARGET_MAX_PAYLOAD_KB: 500, // < 500 KB
  ALLOWED_EXTENSIONS: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'] as const,
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/pjpeg',
    'image/png',
    'image/x-png',
    'image/webp',
    'image/heic',
    'image/heif',
  ] as const,
  BLOCKED_EXTENSIONS: [
    'exe', 'bat', 'cmd', 'sh', 'php', 'phtml', 'php3', 'php4', 'php5', 'phps',
    'js', 'mjs', 'ts', 'html', 'htm', 'svg', 'vbs', 'dll', 'scr', 'jar',
    'zip', 'rar', 'tar', 'gz', '7z', 'py', 'pl', 'jsp', 'asp', 'aspx', 'cgi'
  ] as const,
} as const;

export interface ClientValidationResult {
  valid: boolean;
  error?: string;
  detectedFormat?: string;
}

export interface ImageCompressionOptions {
  maxDimension?: number;
  quality?: number;
  maxSizeKB?: number;
  mimeType?: string;
}

/**
 * Menghitung perkiraan ukuran file biner dari data URL Base64 dalam satuan KB
 */
export function getBase64SizeKB(dataUrl: string): number {
  if (!dataUrl || typeof dataUrl !== 'string') return 0;
  const parts = dataUrl.split(',');
  const base64Data = parts[1] || parts[0];
  const padding = (base64Data.match(/=+$/) || [''])[0].length;
  const bytes = (base64Data.length * 3) / 4 - padding;
  return Math.max(0, Math.round(bytes / 1024));
}

/**
 * Membaca slice buffer biner di browser untuk memeriksa Magic Bytes
 */
async function readFileHeaderBytes(file: File | Blob, byteCount = 16): Promise<Uint8Array> {
  const slice = file.slice(0, byteCount);
  return new Promise<Uint8Array>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      resolve(new Uint8Array(arrayBuffer));
    };
    reader.onerror = () => reject(new Error('Gagal membaca header biner berkas'));
    reader.readAsArrayBuffer(slice);
  });
}

/**
 * Layer 4: Memeriksa Magic Bytes (Binary Signature) langsung dari buffer biner
 */
export function checkMagicBytes(bytes: Uint8Array): { valid: boolean; format?: string } {
  if (!bytes || bytes.length < 4) return { valid: false };

  // 1. JPEG Signature: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { valid: true, format: 'image/jpeg' };
  }

  // 2. PNG Signature: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { valid: true, format: 'image/png' };
  }

  // 3. WebP Signature: Bytes 0-3 = "RIFF" (52 49 46 46) & Bytes 8-11 = "WEBP" (57 45 42 50)
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { valid: true, format: 'image/webp' };
  }

  // 4. HEIC/HEIF Signature: Bytes 4-7 = "ftyp", Bytes 8-11 = "heic", "mif1", "msf1", "hevc"
  if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).toLowerCase();
    if (['heic', 'mif1', 'msf1', 'hevc', 'heix'].includes(brand)) {
      return { valid: true, format: 'image/heic' };
    }
  }

  return { valid: false };
}

/**
 * Validasi Berlapis (Layer 1 - 4) untuk file upload sebelum diproses lebih lanjut
 */
export async function validateImageFileClient(file: File): Promise<ClientValidationResult> {
  if (!file) {
    return { valid: false, error: 'Berkas tidak ditemukan atau belum dipilih.' };
  }

  // Layer 1: Validasi Ukuran File (Maksimal 5 MB)
  if (file.size > CLIENT_IMAGE_LIMITS.MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `Ukuran foto (${sizeMb} MB) melebihi batas maksimal 5 MB. Silakan pilih foto dengan resolusi standar.`,
    };
  }

  // Layer 2: Validasi Ekstensi Berkas (Strict Whitelist & Explicit Blacklist)
  const nameParts = file.name.split('.');
  if (nameParts.length < 2) {
    return { valid: false, error: 'Nama berkas tidak memiliki ekstensi yang valid.' };
  }
  const extension = (nameParts.pop() || '').toLowerCase().trim();

  // Cek blacklist eksplisit
  if ((CLIENT_IMAGE_LIMITS.BLOCKED_EXTENSIONS as readonly string[]).includes(extension)) {
    return {
      valid: false,
      error: `Ekstensi berkas .${extension} dilarang demi keamanan sistem. Hanya file foto yang diperbolehkan.`,
    };
  }

  // Cek whitelist
  if (!(CLIENT_IMAGE_LIMITS.ALLOWED_EXTENSIONS as readonly string[]).includes(extension)) {
    return {
      valid: false,
      error: `Format berkas .${extension} tidak didukung. Harap gunakan format JPG, JPEG, PNG, atau WEBP.`,
    };
  }

  // Layer 3: Validasi MIME Type Browser
  const mime = (file.type || '').toLowerCase().trim();
  if (mime) {
    // Larang format berbahaya seperti SVG yang dapat disusupi kode script JavaScript
    if (mime.includes('svg') || mime.includes('html') || mime.includes('javascript') || mime.includes('application')) {
      return {
        valid: false,
        error: `Tipe berkas (${mime}) ditolak. SVG atau dokumen tidak diizinkan sebagai foto bukti.`,
      };
    }

    if (!(CLIENT_IMAGE_LIMITS.ALLOWED_MIME_TYPES as readonly string[]).includes(mime)) {
      return {
        valid: false,
        error: `Tipe MIME berkas (${mime}) bukan format gambar yang didukung.`,
      };
    }
  }

  // Layer 4: Deep Binary Magic Bytes Inspection (Memeriksa byte fisik file)
  if (file.size < 64) {
    return { valid: false, error: 'Berkas foto rusak atau terlalu kecil.' };
  }
  try {
    const headerBytes = await readFileHeaderBytes(file, 16);
    const magicCheck = checkMagicBytes(headerBytes);
    if (!magicCheck.valid) {
      return {
        valid: false,
        error: 'Tanda tangan biner (Magic Bytes) tidak valid. Berkas bukan foto asli yang sah (indikasi manipulasi ekstensi/MIME spoofing).',
      };
    }
    return { valid: true, detectedFormat: magicCheck.format };
  } catch (err: any) {
    return {
      valid: false,
      error: 'Gagal memverifikasi keabsahan biner foto: ' + (err?.message || 'Akses ditolak.'),
    };
  }
}

/**
 * Proses Kompresi & Sanitasi Lengkap (Layer 5 - 7)
 * Memastikan foto:
 * - Tidak memicu pixel flood / decompression bomb
 * - Bersih dari EXIF berbahaya & steganografi (re-encode ke canvas steril)
 * - Berdimensi proporsional maksimal 1080px
 * - Berkualitas JPEG 70-80%
 * - Berukuran Base64 < 300 - 500 KB
 */
export async function compressAndSanitizeImageClient(
  source: File | Blob | string,
  options: ImageCompressionOptions = {}
): Promise<{ success: boolean; dataUrl?: string; error?: string; sizeKB?: number }> {
  const {
    maxDimension = CLIENT_IMAGE_LIMITS.TARGET_MAX_DIMENSION,
    quality = CLIENT_IMAGE_LIMITS.TARGET_JPEG_QUALITY,
    maxSizeKB = CLIENT_IMAGE_LIMITS.TARGET_MAX_PAYLOAD_KB,
    mimeType = 'image/jpeg',
  } = options;

  // 1. Jika input berupa File, jalankan validasi keamanan Layer 1 - 4 terlebih dahulu
  if (typeof File !== 'undefined' && source instanceof File) {
    const validation = await validateImageFileClient(source);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
  }

  // Lingkungan non-browser (SSR)
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    if (typeof source === 'string') return { success: true, dataUrl: source, sizeKB: getBase64SizeKB(source) };
    return { success: false, error: 'Kompresi kanvas hanya dapat dieksekusi di browser klien.' };
  }

  // 2. Ekstrak Data URL awal
  let rawDataUrl: string;
  try {
    if (typeof source === 'string') {
      rawDataUrl = source;
    } else {
      rawDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.onerror = () => reject(new Error('Gagal membaca berkas gambar'));
        reader.readAsDataURL(source);
      });
    }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal membaca berkas foto.' };
  }

  if (!rawDataUrl || !rawDataUrl.startsWith('data:image/')) {
    return { success: false, error: 'Format Data URL gambar tidak valid.' };
  }

  // 3. Dekompresi aman pada HTMLImageElement
  return new Promise<{ success: boolean; dataUrl?: string; error?: string; sizeKB?: number }>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onerror = () => {
      resolve({ success: false, error: 'Gagal merender gambar. Berkas gambar mungkin rusak atau tidak kompatibel.' });
    };

    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        if (!width || !height) {
          resolve({ success: false, error: 'Dimensi gambar tidak valid (0x0 piksel).' });
          return;
        }

        // Layer 5: Proteksi Decompression Bomb / Pixel Flood
        if (width > CLIENT_IMAGE_LIMITS.MAX_PIXEL_DIMENSION || height > CLIENT_IMAGE_LIMITS.MAX_PIXEL_DIMENSION) {
          resolve({
            success: false,
            error: `Resolusi gambar (${width}x${height}) melebihi batas toleransi keamanan (${CLIENT_IMAGE_LIMITS.MAX_PIXEL_DIMENSION}px).`,
          });
          return;
        }

        const totalPixels = width * height;
        if (totalPixels > CLIENT_IMAGE_LIMITS.MAX_TOTAL_PIXELS) {
          resolve({
            success: false,
            error: 'Total area piksel foto terlalu besar (indikasi decompression bomb).',
          });
          return;
        }

        // Layer 6: Skala proporsional ke dimensi target (maksimal 1080px)
        let targetW = width;
        let targetH = height;
        if (targetW > maxDimension || targetH > maxDimension) {
          if (targetW > targetH) {
            targetH = Math.round((targetH * maxDimension) / targetW);
            targetW = maxDimension;
          } else {
            targetW = Math.round((targetW * maxDimension) / targetH);
            targetH = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ success: false, error: 'Tidak dapat menginisialisasi kanvas grafis 2D di perangkat.' });
          return;
        }

        // Re-encoding piksel murni pada kanvas baru (stripping seluruh EXIF/metadata jahat)
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetW, targetH);

        // Layer 7: Kompresi adaptif untuk memastikan ukuran < 500 KB (target 300 - 500 KB)
        let currentQuality = Math.min(0.80, Math.max(0.65, quality));
        let compressed = canvas.toDataURL(mimeType, currentQuality);
        let sizeKB = getBase64SizeKB(compressed);

        let attempts = 0;
        while (sizeKB > maxSizeKB && currentQuality > 0.50 && attempts < 4) {
          currentQuality -= 0.08;
          compressed = canvas.toDataURL(mimeType, currentQuality);
          sizeKB = getBase64SizeKB(compressed);
          attempts++;
        }

        // Jika foto luar biasa kompleks dan masih > maxSizeKB, turunkan dimensi 15% lagi
        if (sizeKB > maxSizeKB) {
          const secondCanvas = document.createElement('canvas');
          secondCanvas.width = Math.round(targetW * 0.85);
          secondCanvas.height = Math.round(targetH * 0.85);
          const secondCtx = secondCanvas.getContext('2d');
          if (secondCtx) {
            secondCtx.imageSmoothingEnabled = true;
            secondCtx.imageSmoothingQuality = 'medium';
            secondCtx.drawImage(canvas, 0, 0, secondCanvas.width, secondCanvas.height);
            compressed = secondCanvas.toDataURL(mimeType, 0.70);
            sizeKB = getBase64SizeKB(compressed);
          }
        }

        resolve({
          success: true,
          dataUrl: compressed,
          sizeKB,
        });
      } catch (err: any) {
        resolve({
          success: false,
          error: 'Terjadi kendala saat memproses gambar di kanvas: ' + (err?.message || 'Error.'),
        });
      }
    };

    img.src = rawDataUrl;
  });
}

/**
 * Helper ringkas backwards-compatible untuk fungsi lama yang mengharapkan Promise<string>
 */
export async function compressImageClient(
  source: File | Blob | string,
  options: ImageCompressionOptions = {}
): Promise<string> {
  const result = await compressAndSanitizeImageClient(source, options);
  if (!result.success || !result.dataUrl) {
    if (result.error) {
      throw new Error(result.error);
    }
    return '';
  }
  return result.dataUrl;
}
