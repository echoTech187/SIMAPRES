import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSession } from '@/lib/session';
import { consumeRateLimit, getClientIp, RATE_LIMIT_CONFIG } from '@/infrastructure/security/rate-limiter';
import {
  validatePreBodyContentLength,
  validateImageMagicBytes,
  sanitizeAndProcessAvatarImage,
  generateSafeAvatarFilename,
  isPathInsideDirectory,
  cleanupOrphanUserAvatars,
  FILE_UPLOAD_LIMITS,
  SanitizedImageResult,
} from '@/infrastructure/security/file-security.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // --------------------------------------------------------------------------
    // LAYER 1: Pre-Body Content-Length Guard (Mencegah Bandwidth & Memory DoS)
    // --------------------------------------------------------------------------
    const contentLength = req.headers.get('content-length');
    const lengthCheck = validatePreBodyContentLength(contentLength);
    if (!lengthCheck.valid) {
      return NextResponse.json(
        { success: false, error: lengthCheck.error || 'Ukuran berkas melebihi batas maksimal 5MB.' },
        { status: 413, headers: { 'X-Content-Type-Options': 'nosniff' } }
      );
    }

    // --------------------------------------------------------------------------
    // LAYER 2: Autentikasi Sesi & Proteksi IDOR
    // --------------------------------------------------------------------------
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Anda harus login untuk mengunggah foto profil.' },
        { status: 401, headers: { 'X-Content-Type-Options': 'nosniff' } }
      );
    }

    // --------------------------------------------------------------------------
    // LAYER 3: Multi-Tier Rate Limiting (Mencegah Flooding & Disk Exhaustion)
    // --------------------------------------------------------------------------
    const clientIp = await getClientIp();
    const identifier = (session?.identifier || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');
    const rateLimitKey = `upload_avatar:${identifier}:${clientIp}`;

    const rateCheck = consumeRateLimit(
      rateLimitKey,
      RATE_LIMIT_CONFIG.UPLOAD_AVATAR.maxAttempts,
      RATE_LIMIT_CONFIG.UPLOAD_AVATAR.windowMs
    );

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Batas frekuensi upload tercapai. Harap tunggu ${rateCheck.retryAfterSec} detik sebelum mengunggah kembali.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateCheck.retryAfterSec),
            'X-Content-Type-Options': 'nosniff',
          },
        }
      );
    }

    // Baca FormData setelah verifikasi awal lolos
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const nrpParam = (formData.get('nrp') as string | null)?.trim();

    // Pencegahan IDOR: Hanya SUPERADMIN yang boleh mengunggah foto untuk NRP orang lain
    if (nrpParam && nrpParam !== session.identifier && session.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Anda hanya berwenang mengubah foto profil akun dinas sendiri.' },
        { status: 403, headers: { 'X-Content-Type-Options': 'nosniff' } }
      );
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Berkas foto tidak ditemukan.' },
        { status: 400, headers: { 'X-Content-Type-Options': 'nosniff' } }
      );
    }

    // --------------------------------------------------------------------------
    // LAYER 4: Ukuran Berkas & Strict MIME Whitelist
    // --------------------------------------------------------------------------
    if (file.size > FILE_UPLOAD_LIMITS.MAX_RAW_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'Ukuran berkas melebihi batas maksimal 5MB.' },
        { status: 413, headers: { 'X-Content-Type-Options': 'nosniff' } }
      );
    }

    const clientMime = (file.type || '').toLowerCase();
    if (!FILE_UPLOAD_LIMITS.ALLOWED_MIME_TYPES.includes(clientMime as any)) {
      return NextResponse.json(
        { success: false, error: 'Format berkas tidak didukung. Harap unggah berkas gambar JPG, PNG, atau WEBP.' },
        { status: 415, headers: { 'X-Content-Type-Options': 'nosniff' } }
      );
    }

    // --------------------------------------------------------------------------
    // LAYER 5: Deep Binary Magic Bytes Inspection (Anti MIME-Spoofing & Polyglots)
    // --------------------------------------------------------------------------
    const rawBytes = await file.arrayBuffer();
    const rawBuffer = Buffer.from(rawBytes);

    const magicCheck = validateImageMagicBytes(rawBuffer);
    if (!magicCheck.valid) {
      return NextResponse.json(
        { success: false, error: magicCheck.error || 'Berkas bukan gambar valid.' },
        { status: 400, headers: { 'X-Content-Type-Options': 'nosniff' } }
      );
    }

    // --------------------------------------------------------------------------
    // LAYER 6: Decompression Bomb Defense, Re-Encoding & EXIF Stripping via Sharp
    // --------------------------------------------------------------------------
    let sanitizedResult: SanitizedImageResult;
    try {
      sanitizedResult = await sanitizeAndProcessAvatarImage(rawBuffer);
    } catch (procErr: any) {
      return NextResponse.json(
        { success: false, error: `Gagal memproses gambar: ${procErr.message || 'Format tidak aman.'}` },
        { status: 422, headers: { 'X-Content-Type-Options': 'nosniff' } }
      );
    }

    // --------------------------------------------------------------------------
    // LAYER 7: Path Traversal Immunity, Safe Storage & Orphan Cleanup
    // --------------------------------------------------------------------------
    const targetIdentifier = (nrpParam && session.role === 'SUPERADMIN' ? nrpParam : session.identifier) || 'user';
    const filename = generateSafeAvatarFilename(targetIdentifier);
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');

    // Buat direktori dengan izin aman jika belum ada
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
    }

    const filePath = path.join(uploadDir, filename);

    // Verifikasi mutlak bahwa file berada di dalam uploadDir (Anti Path Traversal)
    if (!isPathInsideDirectory(uploadDir, filePath)) {
      return NextResponse.json(
        { success: false, error: 'Terdeteksi pelanggaran keamanan direktori berkas.' },
        { status: 403, headers: { 'X-Content-Type-Options': 'nosniff' } }
      );
    }

    // Tulis buffer yang sudah 100% disterilisasi
    await fs.promises.writeFile(filePath, sanitizedResult.buffer, { mode: 0o644 });

    // Bersihkan avatar lama personil ini untuk mencegah akumulasi disk (Disk Exhaustion DoS)
    await cleanupOrphanUserAvatars(uploadDir, targetIdentifier, filename);

    const publicUrl = `/uploads/avatars/${filename}`;

    return NextResponse.json(
      {
        success: true,
        url: publicUrl,
        filename,
        size: sanitizedResult.byteLength,
        width: sanitizedResult.width,
        height: sanitizedResult.height,
        format: sanitizedResult.format,
      },
      {
        headers: {
          'X-Content-Type-Options': 'nosniff',
        },
      }
    );
  } catch (error: any) {
    console.error('[UploadAvatar] Security error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memproses unggahan foto profil.' },
      { status: 500, headers: { 'X-Content-Type-Options': 'nosniff' } }
    );
  }
}
