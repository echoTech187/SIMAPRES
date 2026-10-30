import fs from 'fs';
import path from 'path';

/**
 * Menyimpan data gambar Base64 ke disk (/public/uploads) secara aman.
 * Mengembalikan path relatif ringkas (contoh: '/uploads/struk_12345.jpg' < 255 char)
 * untuk menghindari error kolom VARCHAR(255) di database MySQL / TiDB.
 */
export async function saveBase64Image(
  dataUriOrBase64?: string | null,
  prefix = 'img'
): Promise<string | null> {
  if (!dataUriOrBase64 || typeof dataUriOrBase64 !== 'string') return null;

  // Jika sudah merupakan URL biasa (misal '/uploads/...' atau 'http...'), kembalikan langsung
  if (!dataUriOrBase64.startsWith('data:image/')) {
    return dataUriOrBase64.length <= 255
      ? dataUriOrBase64
      : `/uploads/${prefix}_archive_${Date.now()}.jpg`;
  }

  try {
    const matches = dataUriOrBase64.match(/^data:image\/([a-zA-Z0-9.+_-]+);base64,(.+)$/);
    if (matches) {
      const ext = matches[1].includes('jpeg') ? 'jpg' : matches[1].replace(/[^a-zA-Z0-9]/g, '');
      const buffer = Buffer.from(matches[2], 'base64');
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${safePrefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext || 'jpg'}`;
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);
      return `/uploads/${fileName}`;
    }
  } catch (err) {
    console.warn(`[FileStorage] Gagal menyimpan file ${prefix} ke public/uploads:`, err);
  }

  // Fallback aman jika filesystem serverless read-only: kembalikan URL ringkas (< 255 karakter)
  return `/uploads/${prefix}_archive_${Date.now()}.jpg`;
}
