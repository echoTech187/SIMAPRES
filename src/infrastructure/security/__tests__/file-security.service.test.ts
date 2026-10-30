import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import {
  validatePreBodyContentLength,
  validateImageMagicBytes,
  sanitizeAndProcessAvatarImage,
  generateSafeAvatarFilename,
  isPathInsideDirectory,
  validateBase64ImagePayload,
  FILE_UPLOAD_LIMITS,
} from '../file-security.service';

describe('Infrastructure Security: File Security & Anti-DoS Service', () => {
  describe('Layer 1: Pre-Body Content-Length Guard', () => {
    it('approves payload sizes within allowable limits', () => {
      const res = validatePreBodyContentLength('1048576'); // 1MB
      expect(res.valid).toBe(true);
    });

    it('rejects payloads exceeding the 5MB maximum limit before reading body', () => {
      const oversized = String(6 * 1024 * 1024); // 6MB
      const res = validatePreBodyContentLength(oversized);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('melebihi batas maksimal 5MB');
    });

    it('rejects malformed or negative Content-Length headers', () => {
      const res = validatePreBodyContentLength('-500');
      expect(res.valid).toBe(false);
    });
  });

  describe('Layer 4: Deep Binary Magic Bytes Inspection', () => {
    it('detects authentic JPEG signatures', () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
      const res = validateImageMagicBytes(jpegBuffer);
      expect(res.valid).toBe(true);
      expect(res.detectedMime).toBe('image/jpeg');
    });

    it('detects authentic PNG signatures', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      const res = validateImageMagicBytes(pngBuffer);
      expect(res.valid).toBe(true);
      expect(res.detectedMime).toBe('image/png');
    });

    it('detects authentic WEBP signatures', () => {
      const webpHeader = Buffer.from('RIFF....WEBP', 'binary');
      const res = validateImageMagicBytes(webpHeader);
      expect(res.valid).toBe(true);
      expect(res.detectedMime).toBe('image/webp');
    });

    it('rejects PHP shell or text files masquerading as images (MIME spoofing)', () => {
      const fakeImage = Buffer.from('<?php echo "malicious shell"; ?>');
      const res = validateImageMagicBytes(fakeImage);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Tanda tangan biner (Magic Bytes) tidak valid');
    });

    it('rejects tiny or truncated buffers', () => {
      const tinyBuffer = Buffer.from([0xff, 0xd8]);
      const res = validateImageMagicBytes(tinyBuffer);
      expect(res.valid).toBe(false);
    });
  });

  describe('Layer 5 & 6: Decompression & Re-Encoding via Sharp', () => {
    it('re-encodes valid images into clean 512x512 WebP buffers', async () => {
      // Buat sample gambar 200x200 via sharp
      const samplePng = await sharp({
        create: {
          width: 200,
          height: 200,
          channels: 4,
          background: { r: 10, g: 50, b: 120, alpha: 1 },
        },
      })
        .png()
        .toBuffer();

      const result = await sanitizeAndProcessAvatarImage(samplePng);
      expect(result.format).toBe('webp');
      expect(result.width).toBe(FILE_UPLOAD_LIMITS.AVATAR_OUTPUT_DIMENSION);
      expect(result.height).toBe(FILE_UPLOAD_LIMITS.AVATAR_OUTPUT_DIMENSION);
      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it('throws error when fed corrupted or unreadable image buffers', async () => {
      const corruptBuffer = Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88]);
      await expect(sanitizeAndProcessAvatarImage(corruptBuffer)).rejects.toThrow();
    });
  });

  describe('Layer 7: Safe Filename & Path Traversal Immunity', () => {
    it('generates unguessable, sanitized filenames with webp extension', () => {
      const filename = generateSafeAvatarFilename('88010088');
      expect(filename).toMatch(/^avatar-88010088-\d+-[a-f0-9]+\.webp$/);
    });

    it('sanitizes dangerous characters and directory traversal attempts in identifiers', () => {
      const filename = generateSafeAvatarFilename('../../etc/passwd#admin');
      expect(filename).not.toContain('..');
      expect(filename).not.toContain('/');
      expect(filename).not.toContain('\\');
      expect(filename).toMatch(/^avatar-______etc_passwd_admin-\d+-[a-f0-9]+\.webp$/);
    });

    it('isPathInsideDirectory detects and blocks directory traversal attempts', () => {
      const baseDir = 'C:\\app\\public\\uploads\\avatars';
      const safePath = 'C:\\app\\public\\uploads\\avatars\\avatar-1.webp';
      const traversalPath = 'C:\\app\\public\\uploads\\avatars\\..\\..\\secret.key';

      expect(isPathInsideDirectory(baseDir, safePath)).toBe(true);
      expect(isPathInsideDirectory(baseDir, traversalPath)).toBe(false);
    });
  });

  describe('Server-Side Base64 Image Payload Guard', () => {
    it('approves authentic JPEG Base64 data URLs', () => {
      // JPEG magic bytes: FF D8 FF E0
      const headerB64 = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x60]).toString('base64');
      const dataUrl = `data:image/jpeg;base64,${headerB64}AAAA`;
      const res = validateBase64ImagePayload(dataUrl);
      expect(res.valid).toBe(true);
      expect(res.detectedMime).toBe('image/jpeg');
    });

    it('approves authentic PNG Base64 data URLs', () => {
      const pngHeaderB64 = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52]).toString('base64');
      const dataUrl = `data:image/png;base64,${pngHeaderB64}AAAA`;
      const res = validateBase64ImagePayload(dataUrl);
      expect(res.valid).toBe(true);
      expect(res.detectedMime).toBe('image/png');
    });

    it('rejects fake base64 strings masquerading as JPEG (MIME spoofing)', () => {
      const fakeB64 = Buffer.from('<?php echo "evil shell script"; ?>').toString('base64');
      const dataUrl = `data:image/jpeg;base64,${fakeB64}`;
      const res = validateBase64ImagePayload(dataUrl);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Integritas biner foto ditolak');
    });

    it('rejects non-image MIME types such as pdf or svg', () => {
      const dataUrl = 'data:application/pdf;base64,JVBERi0xLjUK';
      const res = validateBase64ImagePayload(dataUrl);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('harus berformat Data URL Base64 yang sah');
    });

    it('rejects oversized base64 payloads exceeding max bytes', () => {
      const hugeB64 = Buffer.from([0xff, 0xd8, 0xff, 0xe0]).toString('base64') + 'A'.repeat(7 * 1024 * 1024);
      const dataUrl = `data:image/jpeg;base64,${hugeB64}`;
      const res = validateBase64ImagePayload(dataUrl, 5 * 1024 * 1024);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('melebihi batas maksimal 5 MB');
    });

    it('allows null, undefined, or existing relative static paths', () => {
      expect(validateBase64ImagePayload(null).valid).toBe(true);
      expect(validateBase64ImagePayload(undefined).valid).toBe(true);
      expect(validateBase64ImagePayload('/uploads/avatar.webp').valid).toBe(true);
    });
  });
});
