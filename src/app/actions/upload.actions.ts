'use server';

import fs from 'fs';
import path from 'path';

export interface UploadMediaResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  fileType?: 'DOKUMEN' | 'VIDEO' | 'GAMBAR';
  fileSize?: number;
  mimeType?: string;
  error?: string;
}

const ALLOWED_MIME_TYPES: Record<string, 'DOKUMEN' | 'VIDEO' | 'GAMBAR'> = {
  // Documents
  'application/pdf': 'DOKUMEN',
  'application/msword': 'DOKUMEN',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOKUMEN',
  // Videos
  'video/mp4': 'VIDEO',
  'video/webm': 'VIDEO',
  'video/quicktime': 'VIDEO',
  'video/x-matroska': 'VIDEO',
  // Images
  'image/jpeg': 'GAMBAR',
  'image/png': 'GAMBAR',
  'image/webp': 'GAMBAR',
};

// Batas ukuran maksimal: 60MB untuk Video, 15MB untuk Dokumen & Gambar
const MAX_FILE_SIZE = 60 * 1024 * 1024; // 60 MB

export async function uploadEvidenceMediaAction(formData: FormData): Promise<UploadMediaResult> {
  try {
    const file = formData.get('file') as File | null;
    if (!file) {
      return { success: false, error: 'Tidak ada file yang dipilih untuk diunggah.' };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `Ukuran file melebihi batas maksimal (${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB). Silakan pilih file yang lebih kecil.`,
      };
    }

    const mime = file.type || '';
    const fileType = ALLOWED_MIME_TYPES[mime];
    if (!fileType) {
      // Fallback by extension
      const ext = path.extname(file.name).toLowerCase();
      if (['.pdf', '.doc', '.docx'].includes(ext)) {
        // ok as document
      } else if (['.mp4', '.webm', '.mov', '.mkv'].includes(ext)) {
        // ok as video
      } else if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        // ok as gambar
      } else {
        return {
          success: false,
          error: `Format file "${file.name}" tidak didukung. Harap unggah berkas PDF, Dokumen, Video MP4/WebM, atau Gambar JPG/PNG.`,
        };
      }
    }

    const resolvedType =
      fileType ||
      (file.name.endsWith('.pdf') || file.name.endsWith('.doc') || file.name.endsWith('.docx')
        ? 'DOKUMEN'
        : file.name.endsWith('.mp4') || file.name.endsWith('.webm') || file.name.endsWith('.mov')
        ? 'VIDEO'
        : 'GAMBAR');

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'evidence');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const cleanBaseName = path
      .basename(file.name, path.extname(file.name))
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);
    const ext = path.extname(file.name).toLowerCase() || '.bin';
    const uniqueFileName = `${resolvedType.toLowerCase()}_${cleanBaseName}_${Date.now()}${ext}`;
    const destinationPath = path.join(uploadDir, uniqueFileName);

    fs.writeFileSync(destinationPath, buffer);

    const fileUrl = `/uploads/evidence/${uniqueFileName}`;

    return {
      success: true,
      fileUrl,
      fileName: file.name,
      fileType: resolvedType,
      fileSize: file.size,
      mimeType: file.type,
    };
  } catch (err: any) {
    console.error('Error saat upload media bukti:', err);
    return {
      success: false,
      error: err.message || 'Terjadi kesalahan pada server saat mengunggah file bukti.',
    };
  }
}
