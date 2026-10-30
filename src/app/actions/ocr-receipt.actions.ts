'use server';

import { GoogleGenAI, Type } from '@google/genai';

export interface ScannedReceiptData {
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
 * Mengekstrak Tanggal Pembelian, Jam, Nama SPBU, No. Struk, Jenis BBM, Liter, & Total Rupiah.
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

    // Deteksi MIME type dari data URL jika ada
    let mimeType = 'image/jpeg';
    const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,/);
    if (match && match[1]) {
      mimeType = match[1];
    }
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+_-]+;base64,/, '');

    const ai = new GoogleGenAI({ apiKey });

    // Model prioritas: gemini-3.8-flash adalah model multimodal resmi terbaru yang aktif untuk API key saat ini
    const modelsToTry = [
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
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
                  text: `Anda adalah asisten AI pemeriksa struk BBM dinas kepolisian Presisi 110. Analisis foto struk SPBU Indonesia ini dan ekstrak informasi berikut secara presisi:
1. spbuName: Nama atau kode SPBU (contoh: "SPBU 44.511.02 Kajen" atau "Pertamina Kajen").
2. purchaseDate: Tanggal transaksi pembelian BBM (format standar YYYY-MM-DD, contoh: "2026-10-31"). Jika tertera format DD/MM/YYYY atau DD-MM-YYYY, konversikan ke format YYYY-MM-DD.
3. purchaseTime: Jam/waktu transaksi (format HH:mm, contoh: "14:35").
4. receiptNumber: Nomor struk / No. Transaksi kasir jika tertera.
5. fuelType: Jenis bahan bakar (contoh: "Pertalite", "Pertamax", "Pertamax Turbo", "Biosolar", "Solar", "Dexlite", "Pertamina Dex").
6. liters: Jumlah volume pengisian dalam liter (angka desimal float, contoh: 20.00).
7. totalCostRupiah: Total biaya pembelian dalam Rupiah (angka integer, contoh: 136000).
8. pricePerLiter: Harga satuan BBM per liter dalam Rupiah jika ada.

Pastikan membaca angka desimal koma/titik dan tanggal secara cermat. Jika suatu nilai tidak terbaca pada gambar, kosongkan field tersebut.`,
                },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
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
