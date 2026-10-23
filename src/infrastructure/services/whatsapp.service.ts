import { generateTrackingToken } from '@/lib/tracking-token';

export interface WhatsAppNotificationPayload {
  nomorTiket: string;
  pelaporNama?: string;
  pelaporHp: string;
  jenisKejadian?: string;
  tkpAlamatTeks?: string;
  customMessage?: string;
  appUrl?: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  statusText: string;
  error?: string;
  recipientPhone?: string;
}

/**
 * Normalisasi format nomor handphone Indonesia ke format internasional tanpa tanda '+' (contoh: 628123456789)
 */
export function formatIndonesianPhoneNumber(phone: string): string {
  let clean = phone.replace(/\D/g, ''); // Hapus semua karakter non-angka
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (clean.startsWith('8')) {
    clean = '62' + clean;
  }
  return clean;
}

/**
 * Service Notifikasi WhatsApp Resmi SIMAPRES 110 (Mendukung Gateway FlowKirim REST API)
 */
export class WhatsAppService {
  private static getApiConfig(): {
    apiBase: string;
    apiToken: string;
    deviceId: string;
    sessionId: string;
    polresName: string;
    appUrl: string;
  } {
    const apiBase = (process.env.FLOWKIRIM_API_BASE || 'https://scan.flowkirim.com').replace(/\/+$/, '');
    const apiToken = process.env.FLOWKIRIM_API_TOKEN || process.env.WHATSAPP_API_TOKEN || '';
    const deviceId = process.env.FLOWKIRIM_DEVICE_ID || '';
    const sessionId = process.env.FLOWKIRIM_SESSION_ID || '';
    const polresName = process.env.NEXT_PUBLIC_POLRES_NAME || 'Polsek Pekalongan';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';

    return { apiBase, apiToken, deviceId, sessionId, polresName, appUrl };
  }

  /**
   * Menyusun pesan WhatsApp resmi format SIMOPMAS 110
   */
  public static buildTicketMessage(payload: WhatsAppNotificationPayload): string {
    const { polresName, appUrl: defaultAppUrl } = this.getApiConfig();
    const appUrl = (payload.appUrl || defaultAppUrl || 'http://localhost:3000').replace(/\/+$/, '');
    const cleanTiket = (payload.nomorTiket || '').replace(/^#+/, '').trim();
    const trackingToken = generateTrackingToken(cleanTiket);
    const trackingUrl = `${appUrl}/tracking?tiket=${encodeURIComponent(cleanTiket)}&token=${encodeURIComponent(trackingToken)}`;

    const nama = payload.pelaporNama && payload.pelaporNama !== '-' ? payload.pelaporNama : 'Bapak/Ibu Warga';
    const kategori = payload.jenisKejadian || 'Layanan Pengaduan Kepolisian';
    const alamat = payload.tkpAlamatTeks || '-';

    return (
      `*SENTRA PELAYANAN KEPOLISIAN TERPADU (SPKT) 110*\n` +
      `*${(polresName).toUpperCase()}*\n\n` +
      `Halo *${nama}*,\n\n` +
      `Laporan pengaduan Anda telah kami terima secara resmi di Layanan Polisi 110 dengan data:\n` +
      `📋 *Nomor Tiket:* ${cleanTiket}\n` +
      `🚨 *Kategori Kejadian:* ${kategori}\n` +
      `📍 *Lokasi TKP:* ${alamat}\n\n` +
      `Laporan Anda telah disiarkan ke seluruh armada patroli dan personel piket terdekat untuk penanganan cepat di lapangan.\n\n` +
      `Anda dapat memantau pergerakan personel serta radar taktis penanganan secara langsung melalui tautan resmi berikut:\n` +
      `🔗 ${trackingUrl}\n\n` +
      `_Harap simpan pesan ini sebagai bukti registrasi laporan pengaduan resmi Anda di Layanan Polisi 110._\n` +
      `_Terima kasih atas kerja sama Anda dalam menjaga kamtibmas._`
    );
  }

  /**
   * Mengirim notifikasi WhatsApp ke pelapor via FlowKirim REST API
   */
  public static async sendTicketNotification(payload: WhatsAppNotificationPayload): Promise<WhatsAppSendResult> {
    const { apiBase, apiToken, deviceId, sessionId } = this.getApiConfig();
    const cleanPhone = formatIndonesianPhoneNumber(payload.pelaporHp);

    if (!cleanPhone || cleanPhone.length < 8) {
      return {
        success: false,
        statusText: 'Nomor telepon tidak valid',
        error: `Nomor telepon pelapor "${payload.pelaporHp}" tidak valid.`,
        recipientPhone: cleanPhone,
      };
    }

    // Jika API token belum dikonfigurasi di file .env
    if (!apiToken) {
      console.warn(
        `[WhatsAppService] FLOWKIRIM_API_TOKEN belum diset di .env. Notifikasi ke ${cleanPhone} disimulasikan (berhasil lokal).`
      );
      return {
        success: true,
        statusText: 'Simulasi Terkirim (Token Belum Dikonfigurasi)',
        recipientPhone: cleanPhone,
      };
    }

    // Resolusi session_id dari deviceId jika belum diset langsung
    let activeSessionId = sessionId;
    if (!activeSessionId && deviceId) {
      try {
        const sessionRes = await fetch(`${apiBase}/api/whatsapp/sessions/${encodeURIComponent(deviceId)}`, {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Accept': 'application/json',
          },
        });
        const sessionData = await sessionRes.json().catch(() => null);
        if (sessionRes.ok && sessionData?.data?.session_id) {
          activeSessionId = sessionData.data.session_id;
        } else if (sessionRes.status === 404) {
          return {
            success: false,
            statusText: 'Perangkat Belum Tersambung',
            error: `Device "${deviceId}" belum terhubung / online. Sambungkan QR di https://panel.flowkirim.com/list-device`,
            recipientPhone: cleanPhone,
          };
        }
      } catch (e: any) {
        console.warn('[WhatsAppService] Gagal mendapatkan session dari deviceId:', e.message);
      }
    }

    if (!activeSessionId) {
      return {
        success: false,
        statusText: 'Device ID Belum Ditentukan',
        error: 'Device ID FlowKirim belum dikonfigurasi. Masukkan FLOWKIRIM_DEVICE_ID dari https://panel.flowkirim.com/list-device ke file .env Anda.',
        recipientPhone: cleanPhone,
      };
    }

    const messageText = payload.customMessage || this.buildTicketMessage(payload);
    const toJid = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;

    try {
      const response = await fetch(`${apiBase}/api/whatsapp/messages/text`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          session_id: activeSessionId,
          to: toJid,
          message: messageText,
        }),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok || responseData?.success === false) {
        const errorDetail = responseData?.message || responseData?.error || response.statusText;
        console.error(`[WhatsAppService] Gagal mengirim pesan ke ${cleanPhone}:`, errorDetail);
        return {
          success: false,
          statusText: `Gagal (${response.status})`,
          error: `Error FlowKirim API [HTTP ${response.status}]: ${errorDetail}`,
          recipientPhone: cleanPhone,
        };
      }

      return {
        success: true,
        messageId: responseData?.data?.message_id || responseData?.data?.id || undefined,
        statusText: 'Pesan berhasil terkirim via FlowKirim',
        recipientPhone: cleanPhone,
      };
    } catch (err: any) {
      console.error(`[WhatsAppService] Exception saat menghubungi API gateway:`, err);
      return {
        success: false,
        statusText: 'Koneksi ke Gateway Gagal',
        error: err.message || 'Gagal menghubungi server FlowKirim.',
        recipientPhone: cleanPhone,
      };
    }
  }
}
