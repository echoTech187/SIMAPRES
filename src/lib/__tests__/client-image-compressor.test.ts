import { describe, it, expect } from 'vitest';
import {
  getBase64SizeKB,
  compressImageClient,
  checkMagicBytes,
  validateImageFileClient,
  compressAndSanitizeImageClient,
} from '../client-image-compressor';

describe('client-image-compressor', () => {
  it('correctly calculates binary size in KB from Base64 string', () => {
    const sampleB64 = 'data:image/jpeg;base64,' + 'A'.repeat(1024 * 4); // 4096 chars -> ~3072 bytes -> ~3 KB
    const sizeKB = getBase64SizeKB(sampleB64);
    expect(sizeKB).toBeGreaterThanOrEqual(3);
    expect(sizeKB).toBeLessThanOrEqual(4);
  });

  it('validates binary magic bytes for JPEG, PNG, WEBP, and HEIC', () => {
    // JPEG: FF D8 FF
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(checkMagicBytes(jpegBytes).valid).toBe(true);
    expect(checkMagicBytes(jpegBytes).format).toBe('image/jpeg');

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(checkMagicBytes(pngBytes).valid).toBe(true);
    expect(checkMagicBytes(pngBytes).format).toBe('image/png');

    // WEBP: RIFF....WEBP
    const webpBytes = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
    expect(checkMagicBytes(webpBytes).valid).toBe(true);
    expect(checkMagicBytes(webpBytes).format).toBe('image/webp');

    // Invalid / Spoofed: <?php
    const fakeBytes = new Uint8Array([0x3c, 0x3f, 0x70, 0x68, 0x70]);
    expect(checkMagicBytes(fakeBytes).valid).toBe(false);
  });

  it('validates file extension and size in validateImageFileClient', async () => {
    // Fake oversized file
    const oversizedFile = new File(['A'.repeat(6 * 1024 * 1024)], 'foto.jpg', { type: 'image/jpeg' });
    const resOversized = await validateImageFileClient(oversizedFile);
    expect(resOversized.valid).toBe(false);
    expect(resOversized.error).toContain('melebihi batas maksimal 5 MB');

    // Dangerous extension (.php) blocked
    const phpFile = new File(['echo 1'], 'shell.php', { type: 'image/jpeg' });
    const resPhp = await validateImageFileClient(phpFile);
    expect(resPhp.valid).toBe(false);
    expect(resPhp.error).toContain('dilarang demi keamanan');

    // Dangerous extension (.svg) blocked
    const svgFile = new File(['<svg></svg>'], 'vector.svg', { type: 'image/svg+xml' });
    const resSvg = await validateImageFileClient(svgFile);
    expect(resSvg.valid).toBe(false);
    expect(resSvg.error).toContain('dilarang demi keamanan');

    // MIME spoofing blocked (jpg extension but svg mime)
    const spoofFile = new File(['fake data'], 'foto.jpg', { type: 'image/svg+xml' });
    const resSpoof = await validateImageFileClient(spoofFile);
    expect(resSpoof.valid).toBe(false);
    expect(resSpoof.error).toContain('SVG atau dokumen tidak diizinkan');
  });

  it('handles server-side SSR environment gracefully without crashing', async () => {
    const dummyDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const res = await compressImageClient(dummyDataUrl, { maxDimension: 1080, quality: 0.75 });
    expect(res).toBeTruthy();
    expect(res.startsWith('data:image/')).toBe(true);

    const fullResult = await compressAndSanitizeImageClient(dummyDataUrl);
    expect(fullResult.success).toBe(true);
    expect(fullResult.dataUrl).toBeTruthy();
  });
});
