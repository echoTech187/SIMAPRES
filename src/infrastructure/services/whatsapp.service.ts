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

export interface OfficerAlertPayload {
  nomorTiket: string;
  officerNama: string;
  officerHp: string;
  jenisKejadian: string;
  urgensi: string; // 'DARURAT' | 'SEDANG' | 'NORMAL'
  tkpAlamatTeks: string;
  tkpLat: number;
  tkpLng: number;
  pelaporNama?: string;
  pelaporHp?: string;
  ringkasan?: string;
  deadlineMinutes?: number;
  appUrl?: string;
}

export interface PolsekNoticePayload {
  nomorTiket: string;
  polsekName: string;
  polsekHp: string;
  jenisKejadian: string;
  urgensi: string;
  tkpAlamatTeks: string;
  tkpLat: number;
  tkpLng: number;
  pelaporNama?: string;
  pelaporHp?: string;
  ringkasan?: string;
  deadlineMinutes?: number;
  appUrl?: string;
}

export interface OperatorConsultationPayload {
  nomorTiket: string;
  pelaporNama?: string;
  pelaporHp: string;
  jenisKejadian?: string;
  operatorNotes?: string;
  operatorName?: string;
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
    const polresName = process.env.NEXT_PUBLIC_POLRES_NAME || 'Polres Pekalongan';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';

    return { apiBase, apiToken, deviceId, sessionId, polresName, appUrl };
  }

  /**
   * Mengirim pesan teks umum via Gateway Mandiri Baileys (Prioritas Utama - No Watermark) atau Fallback FlowKirim
   */
  private static async sendRawMessage(recipientPhone: string, messageText: string): Promise<WhatsAppSendResult> {
    const { apiBase, apiToken, deviceId, sessionId } = this.getApiConfig();
    const cleanPhone = formatIndonesianPhoneNumber(recipientPhone);

    if (!cleanPhone || cleanPhone.length < 8) {
      return {
        success: false,
        statusText: 'Nomor telepon tidak valid',
        error: `Nomor telepon "${recipientPhone}" tidak valid.`,
        recipientPhone: cleanPhone,
      };
    }

    // OPSI 1 (Prioritas Utama): Gateway Mandiri Baileys (100% Bebas Biaya & Tanpa Watermark)
    // Jika WA_GATEWAY_URL diatur ke 'flowkirim' / 'off' / 'disabled', lewati Opsi 1 dan langsung ke Opsi 2
    const rawGatewayUrl = (process.env.WA_GATEWAY_URL || '').trim();
    const isGatewayDisabled = rawGatewayUrl.toLowerCase() === 'flowkirim' || rawGatewayUrl.toLowerCase() === 'off' || rawGatewayUrl.toLowerCase() === 'disabled';
    
    // Di mode development gunakan localhost:5001 sebagai default jika tidak didisable
    const localGatewayUrl = isGatewayDisabled
      ? ''
      : (rawGatewayUrl || (process.env.NODE_ENV !== 'production' ? 'http://localhost:5001' : '')).replace(/\/+$/, '');

    if (localGatewayUrl) {
      try {
        const localRes = await fetch(`${localGatewayUrl}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: cleanPhone,
            message: messageText,
          }),
          signal: AbortSignal.timeout(3500),
        });

        if (localRes.ok) {
          const localData = await localRes.json().catch(() => null);
          if (localData?.success) {
            console.log('[WhatsAppService] Pesan terkirim via Opsi 1 (Gateway Mandiri Baileys) ke %s', cleanPhone);
            return {
              success: true,
              messageId: localData.messageId,
              statusText: 'Pesan berhasil terkirim via Gateway Mandiri Mako (Opsi 1 - Bebas Watermark)',
              recipientPhone: cleanPhone,
            };
          }
        }
      } catch (err: any) {
        console.warn(
          '[WhatsAppService] Opsi 1 (Gateway Mandiri Mako) offline/tidak merespons (%s). Otomatis beralih ke Opsi 2 (FlowKirim Cloud)...',
          err.message || 'Timeout'
        );
      }
    }

    // OPSI 2 (Cadangan Handal / Cloud Fallback): FlowKirim REST API
    // Digunakan jika server Mako belum 24 jam, PC operator mati lampu, atau tidak ingin pasang server lokal.

    // 2. Fallback: Jika API token FlowKirim belum dikonfigurasi di file .env
    if (!apiToken) {
      console.warn(
        '[WhatsAppService] FLOWKIRIM_API_TOKEN belum diset di .env. Notifikasi ke %s disimulasikan (berhasil lokal).',
        cleanPhone
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
        console.error('[WhatsAppService] Gagal mengirim pesan ke %s:', cleanPhone, errorDetail);
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
        statusText: 'Pesan berhasil terkirim via FlowKirim (Opsi 2 - Cloud Fallback)',
        recipientPhone: cleanPhone,
      };
    } catch (err: any) {
      console.error('[WhatsAppService] Exception saat menghubungi API gateway:', err);
      return {
        success: false,
        statusText: 'Koneksi ke Gateway Gagal',
        error: err.message || 'Gagal menghubungi server FlowKirim.',
        recipientPhone: cleanPhone,
      };
    }
  }

  /**
   * Menyusun pesan WhatsApp konfirmasi registrasi tiket ke Pelapor (Warga)
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
      `*${polresName.toUpperCase()}*\n\n` +
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
    const messageText = payload.customMessage || this.buildTicketMessage(payload);
    return this.sendRawMessage(payload.pelaporHp, messageText);
  }

  /**
   * Menyusun pesan WhatsApp konfirmasi penyelesaian layanan konsultasi di Meja Operator CAD 110
   */
  public static buildOperatorConsultationMessage(payload: OperatorConsultationPayload): string {
    const { polresName, appUrl: defaultAppUrl } = this.getApiConfig();
    const appUrl = (payload.appUrl || defaultAppUrl || 'http://localhost:3000').replace(/\/+$/, '');
    const cleanTiket = (payload.nomorTiket || '').replace(/^#+/, '').trim();
    const trackingToken = generateTrackingToken(cleanTiket);
    const trackingUrl = `${appUrl}/tracking?tiket=${encodeURIComponent(cleanTiket)}&token=${encodeURIComponent(trackingToken)}&view=operator`;

    const nama = payload.pelaporNama && payload.pelaporNama !== '-' ? payload.pelaporNama : 'Bapak/Ibu Warga';
    const kategori = payload.jenisKejadian || 'Layanan Informasi & Konsultasi 110';
    const operator = payload.operatorName || 'Petugas Operator SPKT 110';
    const notes = payload.operatorNotes || 'Konsultasi telah dilayani dan dijelaskan sesuai SOP kepolisian.';

    return (
      `*SENTRA PELAYANAN KEPOLISIAN TERPADU (SPKT) 110*\n` +
      `*${polresName.toUpperCase()}*\n\n` +
      `Halo *${nama}*,\n\n` +
      `Terima kasih telah menghubungi Call Center Layanan Polisi 110.\n` +
      `Konsultasi / permohonan informasi Anda telah tuntas dilayani langsung di Meja Operator:\n\n` +
      `📋 *Nomor Tiket Layanan:* ${cleanTiket}\n` +
      `💡 *Jenis Layanan:* ${kategori}\n` +
      `👨‍✈️ *Operator Bertugas:* ${operator}\n` +
      `📝 *Catatan Petunjuk / SOP Diberikan:*\n` +
      `_${notes}_\n\n` +
      `Layanan ini berstatus *SELESAI (Tuntas di Meja Operator)* tanpa memerlukan pergerakan armada patroli ke lokasi Anda.\n\n` +
      `⭐ *SURVEI KEPUASAN MASYARAKAT (IKM 110)*\n` +
      `Mohon kesediaan Bapak/Ibu memberikan penilaian rating & ulasan singkat atas keramahan, kecepatan, dan kejelasan informasi Operator kami melalui tautan resmi:\n` +
      `🔗 ${trackingUrl}\n\n` +
      `_Penilaian Anda sangat berharga untuk terus meningkatkan mutu pelayanan Polri Presisi 110._\n` +
      `_Salam Presisi._`
    );
  }

  /**
   * Mengirim notifikasi penyelesaian konsultasi di Meja Operator via FlowKirim REST API
   */
  public static async sendOperatorConsultationNotification(payload: OperatorConsultationPayload): Promise<WhatsAppSendResult> {
    const messageText = this.buildOperatorConsultationMessage(payload);
    return this.sendRawMessage(payload.pelaporHp, messageText);
  }

  /**
   * Menyusun pesan WhatsApp taktis darurat ke Personel Lapangan (2.B Kebutuhan 2)
   */
  public static buildOfficerAlertMessage(payload: OfficerAlertPayload): string {
    const { polresName, appUrl: defaultAppUrl } = this.getApiConfig();
    const appUrl = (payload.appUrl || defaultAppUrl || 'http://localhost:3000').replace(/\/+$/, '');
    const cleanTiket = (payload.nomorTiket || '').replace(/^#+/, '').trim();
    const deadline = payload.deadlineMinutes || 3;
    const gmapsUrl = `https://maps.google.com/?q=${payload.tkpLat},${payload.tkpLng}`;
    const acceptUrl = `${appUrl}/tugas/konfirmasi?tiket=${encodeURIComponent(cleanTiket)}&role=OFFICER`;

    const urgensiIcon = payload.urgensi === 'DARURAT' ? '🔴 DARURAT' : '🟡 SEDANG';
    const pelaporInfo = payload.pelaporNama ? `${payload.pelaporNama} (${payload.pelaporHp || '-'})` : '-';

    return (
      `🚨 *[DISPOSISI TAKTIS 110 - PERINTAH TUGAS SEGERA]* 🚨\n` +
      `*${polresName.toUpperCase()}*\n\n` +
      `Yth. *${payload.officerNama}*,\n\n` +
      `Anda menerima perintah tugas respon cepat dari Pawas Mako 110:\n\n` +
      `📋 *Nomor Tiket:* ${cleanTiket}\n` +
      `⚡ *Urgensi:* ${urgensiIcon} (Target Respon: ${deadline} Menit)\n` +
      `🚨 *Kasus:* ${payload.jenisKejadian}\n` +
      `📍 *Lokasi TKP:* ${payload.tkpAlamatTeks}\n` +
      `👤 *Pelapor:* ${pelaporInfo}\n` +
      `📝 *Ringkasan:* ${payload.ringkasan || '-'}\n\n` +
      `🗺️ *Navigasi Google Maps Langsung ke TKP:*\n` +
      `${gmapsUrl}\n\n` +
      `👉 *Klik Konfirmasi Terima Tugas (One-Tap):*\n` +
      `${acceptUrl}\n\n` +
      `_Harap segera konfirmasi penerimaan tugas. Sirine eskalasi Mako akan berbunyi jika tidak direspon dalam ${deadline} menit._`
    );
  }

  /**
   * Mengirim notifikasi WhatsApp taktis ke Personel Lapangan
   */
  public static async sendOfficerAlert(payload: OfficerAlertPayload): Promise<WhatsAppSendResult> {
    const messageText = this.buildOfficerAlertMessage(payload);
    return this.sendRawMessage(payload.officerHp, messageText);
  }

  /**
   * Menyusun pesan WhatsApp notifikasi kewilayahan ke Piket SPKT Polsek (2.C Kebutuhan 1)
   */
  public static buildPolsekNoticeMessage(payload: PolsekNoticePayload): string {
    const { polresName, appUrl: defaultAppUrl } = this.getApiConfig();
    const appUrl = (payload.appUrl || defaultAppUrl || 'http://localhost:3000').replace(/\/+$/, '');
    const cleanTiket = (payload.nomorTiket || '').replace(/^#+/, '').trim();
    const deadline = payload.deadlineMinutes || 3;
    const gmapsUrl = `https://maps.google.com/?q=${payload.tkpLat},${payload.tkpLng}`;
    const acceptUrl = `${appUrl}/tugas/konfirmasi?tiket=${encodeURIComponent(cleanTiket)}&role=POLSEK`;

    const urgensiIcon = payload.urgensi === 'DARURAT' ? '🔴 DARURAT' : '🟡 SEDANG';
    const pelaporInfo = payload.pelaporNama ? `${payload.pelaporNama} (${payload.pelaporHp || '-'})` : '-';

    return (
      `📢 *[DISPOSISI WILAYAH - SPKT MAKO 110]* 📢\n` +
      `*${polresName.toUpperCase()}*\n\n` +
      `Kepada: *Yth. Ka SPKT / Petugas Piket ${payload.polsekName}*\n\n` +
      `Telah masuk laporan pengaduan masyarakat di wilayah hukum Polsek Anda:\n\n` +
      `📋 *Nomor Tiket:* ${cleanTiket}\n` +
      `⚡ *Tingkat Urgensi:* ${urgensiIcon}\n` +
      `🚨 *Kasus / Kejadian:* ${payload.jenisKejadian}\n` +
      `📍 *Alamat TKP:* ${payload.tkpAlamatTeks}\n` +
      `👤 *Pelapor:* ${pelaporInfo}\n` +
      `📝 *Ringkasan:* ${payload.ringkasan || '-'}\n\n` +
      `🗺️ *Rute Navigasi Lokasi TKP:*\n` +
      `${gmapsUrl}\n\n` +
      `👉 *Konfirmasi Penerimaan Tugas / Monitor Piket:*\n` +
      `${acceptUrl}\n\n` +
      `_Pawas Mako memantau respon penanganan dalam ${deadline} menit. Mohon segera siagakan regu patroli terdekat menuju lokasi TKP._`
    );
  }

  /**
   * Mengirim notifikasi WhatsApp ke Piket SPKT Polsek
   */
  public static async sendPolsekNotice(payload: PolsekNoticePayload): Promise<WhatsAppSendResult> {
    const messageText = this.buildPolsekNoticeMessage(payload);
    return this.sendRawMessage(payload.polsekHp, messageText);
  }
}
