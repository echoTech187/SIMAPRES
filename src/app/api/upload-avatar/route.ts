import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const nrpParam = (formData.get('nrp') as string | null)?.trim();

    if (!file) {
      return NextResponse.json({ success: false, error: 'Berkas foto tidak ditemukan.' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'Format berkas tidak didukung. Harap unggah format JPG, PNG, atau WEBP.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'Ukuran berkas melebihi batas maksimal 5MB.' },
        { status: 400 }
      );
    }

    // Tentukan identifier (NRP atau username sesi)
    const identifier = (session?.identifier || nrpParam || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');

    // Tentukan ekstensi berkas
    let ext = 'jpg';
    if (file.type.includes('png')) ext = 'png';
    else if (file.type.includes('webp')) ext = 'webp';
    else if (file.name.includes('.')) {
      const parts = file.name.split('.');
      const candidate = parts[parts.length - 1].toLowerCase();
      if (['jpg', 'jpeg', 'png', 'webp'].includes(candidate)) {
        ext = candidate === 'jpeg' ? 'jpg' : candidate;
      }
    }

    const filename = `avatar-${identifier}-${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');

    // Buat direktori jika belum ada
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/uploads/avatars/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: file.size,
    });
  } catch (error: any) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengunggah foto profil ke server.' },
      { status: 500 }
    );
  }
}
