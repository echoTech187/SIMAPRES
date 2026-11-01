/**
 * SIMAPRES 110 - USE CASE: EVALUATE CAD 5W+1H QUALITY VIA GEMINI AI
 * Lapisan: Application (AI Auditor / Quality Control)
 * 
 * ATURAN PENTING:
 * - Menggunakan Google Gen AI SDK dengan model `gemini-3.1-flash-lite`
 * - Evaluasi menggunakan bahasa formal kedinasan kepolisian (bukan istilah asing)
 * - Hanya bertugas mengevaluasi kelengkapan narasi manual operator
 * - Menghasilkan catatan evaluasi internal (untuk konsol Kapolsek/Pawas)
 */

import { GoogleGenAI, Type } from '@google/genai';
import { Cad5W1HEvaluationResult, evaluate5W1HHeuristic } from '@/domain/rules/cad-5w1h.rules';

export interface EvaluateCad5W1HInput {
  ringkasanKeterangan: string;
  subkasusNama?: string | null;
  kategoriNama?: string | null;
  tkpAlamat?: string | null;
  hasGps?: boolean;
  pelaporNama?: string | null;
  pelaporHp?: string | null;
}

export class EvaluateCad5W1HUseCase {
  async execute(input: EvaluateCad5W1HInput): Promise<Cad5W1HEvaluationResult> {
    const rawText = (input.ringkasanKeterangan || '').trim();
    if (!rawText) {
      return evaluate5W1HHeuristic(input);
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      return evaluate5W1HHeuristic(input);
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
Anda adalah Auditor Mutu Kepolisian Khusus Sentra Pelayanan Kepolisian Terpadu (SPKT) Layanan Polisi 110.
Tugas Anda adalah mengevaluasi kelengkapan narasi laporan CAD yang diketik MANUAL oleh petugas operator menggunakan standar formal kedinasan Polri.

Data Laporan Tiket:
- Subkategori Kasus: "${input.subkasusNama || 'Umum'}" (Kategori: "${input.kategoriNama || 'Kamtibmas'}")
- Alamat TKP / Wilayah: "${input.tkpAlamat || '-'}" (Koordinat GPS: ${input.hasGps ? 'Ada/Valid' : 'Nol/Kosong'})
- Pelapor: "${input.pelaporNama || '-'}" (${input.pelaporHp || '-'})
- Ringkasan Keterangan / Kronologi Manual Operator:
"${rawText}"

Instruksi Penilaian:
1. Periksa kelengkapan 6 unsur laporan kepolisian:
   - hasWhat: Apakah pokok peristiwa/masalah kejadian jelas?
   - hasWho: Apakah pihak yang terlibat (korban/pelaku/warga/pelapor) teridentifikasi?
   - hasWhere: Apakah kejelasan lokasi dan patokan TKP spesifik?
   - hasWhen: Apakah keterangan waktu atau indikasi jam kejadian disebutkan?
   - hasWhy: Apakah dugaan motif/penyebab peristiwa diuraikan?
   - hasHow: Apakah kronologi dan situasi terkini di TKP dijelaskan?
2. Periksa kesesuaian Subkasus (isSubcategoryAligned):
   - Apakah ringkasan keterangan tersebut benar-benar relevan dan selaras dengan Subkategori Kasus "${input.subkasusNama || '-'}" yang dipilih?
3. Berikan skor mutu dari 0 sampai 100.
4. Buat catatan evaluasi internal (1-2 kalimat) yang ditujukan untuk Kapolsek / Pawas sebagai bahan evaluasi kedinasan. Catatan ini menggunakan bahasa formal kedinasan Polri yang tegas (contoh: "Catatan Evaluasi Kedinasan: Narasi laporan belum memuat kejelasan lokasi/patokan TKP serta belum selaras dengan subkasus Laka Lantas."). Catatan ini rahasia dan tidak ditampilkan kepada operator.

Kembalikan hasil dalam format JSON terstruktur persis sesuai schema.
      `.trim();

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER },
              hasWhat: { type: Type.BOOLEAN },
              hasWho: { type: Type.BOOLEAN },
              hasWhere: { type: Type.BOOLEAN },
              hasWhen: { type: Type.BOOLEAN },
              hasWhy: { type: Type.BOOLEAN },
              hasHow: { type: Type.BOOLEAN },
              isSubcategoryAligned: { type: Type.BOOLEAN },
              internalEvaluationNotes: { type: Type.STRING },
            },
            required: [
              'score',
              'hasWhat',
              'hasWho',
              'hasWhere',
              'hasWhen',
              'hasWhy',
              'hasHow',
              'isSubcategoryAligned',
              'internalEvaluationNotes',
            ],
          },
        },
      });

      const jsonText = response.text?.trim();
      if (!jsonText) {
        return evaluate5W1HHeuristic(input);
      }

      const parsed = JSON.parse(jsonText);
      return {
        score: typeof parsed.score === 'number' ? Math.min(100, Math.max(0, parsed.score)) : 75,
        hasWhat: Boolean(parsed.hasWhat),
        hasWho: Boolean(parsed.hasWho),
        hasWhere: Boolean(parsed.hasWhere),
        hasWhen: Boolean(parsed.hasWhen),
        hasWhy: Boolean(parsed.hasWhy),
        hasHow: Boolean(parsed.hasHow),
        isSubcategoryAligned: Boolean(parsed.isSubcategoryAligned),
        internalEvaluationNotes: parsed.internalEvaluationNotes || 'Narasi laporan telah dievaluasi oleh sistem audit kedinasan.',
      };
    } catch (_err) {
      return evaluate5W1HHeuristic(input);
    }
  }
}
