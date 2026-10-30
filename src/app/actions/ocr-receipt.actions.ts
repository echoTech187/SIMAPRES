'use server';

import { GoogleGenAI, Type } from '@google/genai';
import { validateBase64ImagePayload } from '@/infrastructure/security/file-security.service';

export interface ScannedReceiptData {
  // Analisis Forensik & Keaslian Struk BBM
  isValidSpbuReceipt?: boolean;
  authenticityStatus?: 'ASLI_VALID' | 'MERAGUKAN' | 'BUKAN_STRUK_SPBU' | 'REKAYASA_DIGITAL';
  authenticityScore?: number; // Skor 0 - 100
  isPhysicalPaper?: boolean;
  isScreenPhoto?: boolean;
  authenticityReason?: string;

  // Data Transaksi Struk
  spbuName?: string;
  purchaseDate?: string;
  purchaseTime?: string;
  receiptNumber?: string;
  fuelType?: string;
  liters?: number;
  totalCostRupiah?: number;
  pricePerLiter?: number;
  notes?: string;
}

/**
 * Server Action untuk memindai foto struk SPBU menggunakan Gemini AI Vision
 * Mendeteksi keaslian fisik struk (anti-fraud) serta mengekstrak data transaksi BBM secara kilat (2-4 detik).
 */
export async function scanReceiptSpbuAction(
  imageBase64: string
): Promise<{ success: boolean; data?: ScannedReceiptData; error?: string }> {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        error:
          'Kunci API Gemini belum dikonfigurasi. Silakan tambahkan GEMINI_API_KEY="..." di berkas .env untuk mengaktifkan pemindaian otomatis struk.',
      };
    }

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return {
        success: false,
        error: 'Berkas foto struk tidak valid atau kosong.',
      };
    }

    // Layer Keamanan: Validasi integritas Base64 & binary signature
    const vCheck = validateBase64ImagePayload(imageBase64);
    if (!vCheck.valid) {
      return { success: false, error: 'Foto struk ditolak: ' + vCheck.error };
    }

    // Deteksi MIME type dari data URL jika ada
    let mimeType = 'image/jpeg';
    const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,/);
    if (match && match[1]) {
      mimeType = match[1];
    }
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+_-]+;base64,/, '');

    const ai = new GoogleGenAI({ apiKey });

    // Prioritaskan model generasi Gemini 3.* Flash (respon kilat ~2-4 detik)
    const modelsToTry = [
      'gemini-3.5-flash',
      'gemini-3.6-flash',
      'gemini-3.8-flash',
      'gemini-flash-latest',
    ];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: cleanBase64,
                  },
                },
                {
                  text: `Anda adalah asisten AI auditor forensik struk BBM dinas kepolisian Presisi 110. Analisis foto struk SPBU Indonesia ini dan lakukan dua hal utama:

1. PEMERIKSAAN KEASLIAN (ANTI-FRAUD / FORENSIK FISIK):
   - isValidSpbuReceipt (boolean): Apakah gambar ini benar-benar struk pembelian BBM SPBU (Pertamina, Shell, BP, Vivo, dll) dan bukan struk toko umum/parkir/dokumen lain.
   - authenticityStatus (string): Tentukan status keaslian:
     * "ASLI_VALID": Kertas struk fisik nyata tercetak printer SPBU asli tanpa tanda manipulasi.
     * "MERAGUKAN": Kertas buram, teks terpotong tidak terbaca, atau ada coretan yang mencurigakan.
     * "BUKAN_STRUK_SPBU": Bukan struk pembelian BBM (foto barang lain, faktur umum, struk minimarket).
     * "REKAYASA_DIGITAL": Terdeteksi foto dari layar HP/monitor lain (terlihat garis moire/pixel LCD) atau manipulasi font digital.
   - authenticityScore (number): Skor persentase keyakinan keaslian fisik (0 sampai 100).
   - isPhysicalPaper (boolean): Apakah terlihat kertas fisik nyata dengan tekstur, bayangan, atau lipatan alami.
   - isScreenPhoto (boolean): Apakah gambar merupakan hasil memfoto layar monitor komputer atau layar smartphone lain.
   - authenticityReason (string): Uraian kesimpulan audit keaslian dalam 1-2 kalimat Bahasa Indonesia ringkas.

2. EKSTRAKSI INFORMASI TRANSAKSI:
   - spbuName: Nama atau kode SPBU (contoh: "SPBU 44.511.02 Kajen" atau "Pertamina Kajen").
   - purchaseDate: Tanggal transaksi pembelian BBM (format standar YYYY-MM-DD, contoh: "2026-10-31"). Jika tertera DD/MM/YYYY atau DD-MM-YYYY, konversikan ke YYYY-MM-DD.
   - purchaseTime: Jam/waktu transaksi (format HH:mm, contoh: "14:35").
   - receiptNumber: Nomor struk / No. Transaksi kasir jika tertera.
   - fuelType: Jenis bahan bakar (contoh: "Pertalite", "Pertamax", "Pertamax Turbo", "Biosolar", "Solar", "Dexlite", "Pertamina Dex").
   - liters: Jumlah volume pengisian dalam liter (angka desimal float, contoh: 20.00).
   - totalCostRupiah: Total biaya pembelian dalam Rupiah (angka integer, contoh: 136000).
   - pricePerLiter: Harga satuan BBM per liter dalam Rupiah jika ada.

Jika ada kolom transaksi yang tidak terbaca, kosongkan kolom tersebut namun tetap berikan penilaian keaslian struk.`,
                },
              ],
            },
          ],
          config: {
            thinkingConfig: { thinkingBudget: 0 },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isValidSpbuReceipt: { type: Type.BOOLEAN },
                authenticityStatus: { type: Type.STRING },
                authenticityScore: { type: Type.INTEGER },
                isPhysicalPaper: { type: Type.BOOLEAN },
                isScreenPhoto: { type: Type.BOOLEAN },
                authenticityReason: { type: Type.STRING },
                spbuName: { type: Type.STRING },
                purchaseDate: { type: Type.STRING },
                purchaseTime: { type: Type.STRING },
                receiptNumber: { type: Type.STRING },
                fuelType: { type: Type.STRING },
                liters: { type: Type.NUMBER },
                totalCostRupiah: { type: Type.NUMBER },
                pricePerLiter: { type: Type.NUMBER },
              },
            },
          },
        });

        const parsed: ScannedReceiptData = JSON.parse(response.text || '{}');
        return {
          success: true,
          data: parsed,
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`[OCR SPBU] Model ${modelName} gagal: ${err?.message || err}. Mencoba fallback...`);
      }
    }

    throw lastError || new Error('Gagal memproses gambar struk dengan semua model Gemini.');
  } catch (error: any) {
    console.error('Error scanning SPBU receipt with Gemini AI:', error);
    let cleanMsg = error?.message || 'Gagal memindai struk dengan AI Vision.';
    try {
      const parsedJson = JSON.parse(cleanMsg);
      if (parsedJson?.error?.message) {
        cleanMsg = parsedJson.error.message;
      }
    } catch {
      // bukan JSON, gunakan pesan apa adanya
    }
    return {
      success: false,
      error: cleanMsg,
    };
  }
}
