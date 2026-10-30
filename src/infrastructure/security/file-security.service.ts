/**
 * SIMAPRES 110 - FILE UPLOAD HARDENING & ANTI-DOS SECURITY ENGINE
 * 
 * Lapisan: Infrastructure / Security
 * Prinsip: Defense-in-Depth (7-Layer Bulletproof Protection)
 * Proteksi:
 * 1. Pre-Body Stream Content-Length Guard (mencegah bandwidth & RAM saturation)
 * 2. Multi-Tier Rate Limiting (mencegah flood & disk exhaustion)
 * 3. Strict MIME & Extension Whitelist (mencegah file ekstensi berbahaya)
 * 4. Deep Binary Magic Bytes Inspection (mencegah MIME-spoofing & polyglot shells)
 * 5. Decompression Bomb & Pixel Flood Defense (mencegah memory explosion via sharp)
 * 6. Pixel Sanitization & Binary Neutralization (re-encode via libvips, strip all EXIF/metadata)
 * 7. Path Traversal Immunity & Cryptographic Filename Isolation
 */

import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import sharp from 'sharp';

export const FILE_UPLOAD_LIMITS = {
  // Ukuran maksimal payload mentah sebelum decoding (5 MB)
  MAX_RAW_SIZE_BYTES: 5 * 1024 * 1024,
  // Buffer toleransi multipart boundary header HTTP (64 KB)
  BOUNDARY_OVERHEAD_BYTES: 64 * 1024,
  // Dimensi pixel maksimal (mencegah dekompresi bomb / pixel flood)
  MAX_PIXEL_DIMENSION: 4096,
  // Area pixel maksimal (maks 8 Megapixel)
  MAX_PIXEL_AREA: 8 * 1024 * 1024,
  // Dimensi output standar foto profil (avatar)
  AVATAR_OUTPUT_DIMENSION: 512,
  // Kualitas kompresi WebP bersih
  OUTPUT_WEBP_QUALITY: 85,
  // Format yang diizinkan secara resmi
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
  ALLOWED_EXTENSIONS: ['jpg', 'jpeg', 'png', 'webp'] as const,
} as const;

export interface MagicByteValidationResult {
  valid: boolean;
  detectedMime?: 'image/jpeg' | 'image/png' | 'image/webp';
  error?: string;
}

export interface SanitizedImageResult {
  buffer: Buffer;
  width: number;
  height: number;
  format: 'webp';
  byteLength: number;
}

/**
 * Layer 1: Validasi Content-Length pada Header HTTP Sebelum Stream Dibaca ke Memori.
 * Mencegah server membaca payload ratusan MB / GB yang dapat menyebabkan DoS.
 */
export function validatePreBodyContentLength(
  contentLengthHeader: string | null,
  maxBytes: number = FILE_UPLOAD_LIMITS.MAX_RAW_SIZE_BYTES
): { valid: boolean; error?: string } {
  if (!contentLengthHeader) {
    return { valid: true }; // Chunked transfer atau header tidak terkirim
  }

  const contentLength = parseInt(contentLengthHeader, 10);
  if (isNaN(contentLength) || contentLength < 0) {
    return { valid: false, error: 'Header Content-Length tidak valid.' };
  }

  const allowedMaxWithOverhead = maxBytes + FILE_UPLOAD_LIMITS.BOUNDARY_OVERHEAD_BYTES;
  if (contentLength > allowedMaxWithOverhead) {
    return {
      valid: false,
      error: `Ukuran payload (${(contentLength / (1024 * 1024)).toFixed(1)}MB) melebihi batas maksimal 5MB.`,
    };
  }

  return { valid: true };
}

/**
 * Layer 4: Inspeksi Binary Signature (Magic Bytes) secara mendalam.
 * Menjamin file benar-benar gambar asli, bukan shell PHP / binary eksekusi bertopeng MIME palsu.
 */
export function validateImageMagicBytes(buffer: Buffer): MagicByteValidationResult {
  if (!buffer || buffer.length < 12) {
    return { valid: false, error: 'Berkas rusak atau terlalu kecil untuk diidentifikasi.' };
  }

  // 1. JPEG Signature: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedMime: 'image/jpeg' };
  }

  // 2. PNG Signature: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, detectedMime: 'image/png' };
  }

  // 3. WEBP Signature: Bytes 0-3 = "RIFF" (52 49 46 46) & Bytes 8-11 = "WEBP" (57 45 42 50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, detectedMime: 'image/webp' };
  }

  return {
    valid: false,
    error: 'Tanda tangan biner (Magic Bytes) tidak valid. Berkas bukan format gambar JPG, PNG, atau WEBP asli.',
  };
}

/**
 * Layer 5 & 6: Dekompresi Aman, Netralisasi Binary & Re-Encoding via Sharp (libvips).
 * - Menolak Pixel Flood / Zip Decompression Bombs
 * - Menghapus seluruh EXIF/IPTC metadata (mencegah kebocoran GPS & script tersembunyi)
 * - Mere-encode piksel murni menjadi berkas WebP baru yang 100% steril
 */
export async function sanitizeAndProcessAvatarImage(
  inputBuffer: Buffer
): Promise<SanitizedImageResult> {
  // Inisialisasi pipeline Sharp dengan batas memori ketat
  const image = sharp(inputBuffer, {
    failOn: 'error',
    limitInputPixels: FILE_UPLOAD_LIMITS.MAX_PIXEL_AREA,
  });

  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error('Dimensi gambar tidak valid atau berkas grafis korup.');
  }

  // Layer 5: Proteksi Decompression Bomb (Dimensi raksasa)
  if (
    metadata.width > FILE_UPLOAD_LIMITS.MAX_PIXEL_DIMENSION ||
    metadata.height > FILE_UPLOAD_LIMITS.MAX_PIXEL_DIMENSION
  ) {
    throw new Error(
      `Dimensi gambar (${metadata.width}x${metadata.height}) melebihi batas aman maksimal ${FILE_UPLOAD_LIMITS.MAX_PIXEL_DIMENSION}px.`
    );
  }

  const totalPixels = metadata.width * metadata.height;
  if (totalPixels > FILE_UPLOAD_LIMITS.MAX_PIXEL_AREA) {
    throw new Error('Resolusi gambar melebihi batas area dekompresi aman.');
  }

  // Layer 6: Re-encode & Sanitize
  // Resize proporsional menjadi avatar standar, strip metadata, konversi ke WebP kualitas tinggi
  const cleanBuffer = await sharp(inputBuffer)
    .resize(FILE_UPLOAD_LIMITS.AVATAR_OUTPUT_DIMENSION, FILE_UPLOAD_LIMITS.AVATAR_OUTPUT_DIMENSION, {
      fit: 'cover',
      position: 'center',
      withoutEnlargement: false,
    })
    .webp({
      quality: FILE_UPLOAD_LIMITS.OUTPUT_WEBP_QUALITY,
      effort: 4, // optimasi kompresi seimbang
    })
    .toBuffer();

  return {
    buffer: cleanBuffer,
    width: FILE_UPLOAD_LIMITS.AVATAR_OUTPUT_DIMENSION,
    height: FILE_UPLOAD_LIMITS.AVATAR_OUTPUT_DIMENSION,
    format: 'webp',
    byteLength: cleanBuffer.length,
  };
}

/**
 * Layer 7: Pembuatan Nama Berkas Unguessable & Anti Path-Traversal.
 */
export function generateSafeAvatarFilename(identifier: string): string {
  const sanitizedId = identifier.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32);
  const randomSuffix = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  return `avatar-${sanitizedId}-${Date.now()}-${randomSuffix}.webp`;
}

/**
 * Memverifikasi bahwa path tujuan benar-benar berada di dalam direktori upload yang sah.
 */
export function isPathInsideDirectory(baseDir: string, targetPath: string): boolean {
  const relative = path.relative(baseDir, targetPath);
  return !relative.startsWith('..') && !path.isAbsolute(relative);
}

/**
 * Membersihkan berkas avatar lama milik personil untuk mencegah akumulasi disk (Disk Exhaustion DoS).
 */
export async function cleanupOrphanUserAvatars(
  uploadDir: string,
  identifier: string,
  currentFilename: string
): Promise<void> {
  try {
    const sanitizedId = identifier.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32);
    const prefix = `avatar-${sanitizedId}-`;
    const files = await fs.promises.readdir(uploadDir);

    for (const file of files) {
      if (file.startsWith(prefix) && file !== currentFilename) {
        const fullPath = path.join(uploadDir, file);
        if (isPathInsideDirectory(uploadDir, fullPath)) {
          await fs.promises.unlink(fullPath).catch(() => {});
        }
      }
    }
  } catch (_e) {
    // Non-blocking cleanup
  }
}
