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

export async function uploadEvidenceMediaAction(_formData: FormData): Promise<UploadMediaResult> {
  // Sesuai SOP SIMAPRES 110: alur upload file bukti telah dinonaktifkan untuk efisiensi lapangan
  return {
    success: false,
    error: 'Upload bukti visual telah dinonaktifkan sesuai SOP SIMAPRES 110.',
  };
}
