'use server';

import { UseCaseFactory } from '@/application/factories/use-case.factory';
import type { ChatMessageItem } from '@/types/chat.types';
import { cacheInvalidate } from '@/infrastructure/cache/app-cache';
import { getSession, requireRole } from '@/lib/session';
import { verifyTrackingToken } from '@/lib/tracking-token';

// In-memory fallback / quick cache for ultra-responsive low-latency chat
const chatCache = new Map<string, ChatMessageItem[]>();

export async function getTicketChatMessagesAction(
  complaintIdOrTiket: string,
  token?: string
): Promise<{ success: boolean; data: ChatMessageItem[]; isTicketClosed?: boolean; error?: string }> {
  try {
    if (!complaintIdOrTiket) {
      return { success: true, data: [] };
    }

    const rawKey = complaintIdOrTiket.trim();
    const cleanKey = rawKey.replace(/^#+/, '').trim();
    const withHash = `#${cleanKey}`;

    // Verifikasi Otorisasi: Petugas Kedinasan (Sesi Aktif) ATAU Warga Pelapor (HMAC Tracking Token)
    let isAuthorized = false;
    const session = await getSession();
    if (session && ['PERSONIL', 'OPERATOR', 'PAWAS', 'SUPERADMIN', 'LOGISTIK', 'PIMPINAN'].includes(session.role)) {
      isAuthorized = true;
    } else if (process.env.NODE_ENV !== 'production' && process.env.SIMAPRES_BYPASS_AUTH === 'true') {
      isAuthorized = true;
    } else if (token) {
      isAuthorized = verifyTrackingToken(rawKey, token) || verifyTrackingToken(cleanKey, token);
    }

    if (!isAuthorized) {
      return {
        success: false,
        data: [],
        error: 'Akses ditolak: Diperlukan sesi dinas aktif atau token pelacakan tiket yang sah.',
      };
    }

    const chatRepo = UseCaseFactory.getChatRepository();

    // 1. Cari data tiket via domain repository
    const complaint = await chatRepo.findComplaintByKey(rawKey);

    if (!complaint) {
      // Tiket belum terdaftar di DB, ambil dari cache memori jika ada
      return { success: true, data: chatCache.get(cleanKey) || chatCache.get(rawKey) || [] };
    }

    // 2. Jika tiket / pengaduan SUDAH SELESAI, riwayat chat tidak perlu lagi ditampilkan
    const statusUpper = (complaint.status || '').toUpperCase();
    if (statusUpper === 'SELESAI') {
      return {
        success: true,
        data: [],
        isTicketClosed: true,
      };
    }

    // 3. Ambil riwayat chat dari tabel terdedikasi `complaint_chats`
    let parsedMessages = await chatRepo.getMessagesByComplaintId(complaint.id);

    // 4. Jika di tabel complaint_chats belum ada pesan (migrasi/legacy dev), cek audit log fallback
    if (parsedMessages.length === 0) {
      parsedMessages = await chatRepo.getLegacyAuditMessages(complaint.id);
    }

    // 5. Gabungkan dengan cache in-memory untuk pesan ultra-responsif yang belum sempat tersimpan ke DB
    const cached = chatCache.get(cleanKey) || chatCache.get(rawKey) || [];
    for (const c of cached) {
      const alreadyInDb = parsedMessages.some(
        (m) =>
          m.id === c.id ||
          (m.senderRole === c.senderRole &&
            m.text.trim() === c.text.trim() &&
            Math.abs(new Date(m.timestamp).getTime() - new Date(c.timestamp).getTime()) < 30000)
      );
      if (!alreadyInDb) {
        parsedMessages.push(c);
      }
    }

    // Urutkan berdasarkan waktu
    parsedMessages.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Deduplikasi final: pastikan tidak ada pesan kembar (id sama, atau senderRole + text sama dalam selisih 15 detik)
    const deduplicated: ChatMessageItem[] = [];
    for (const msg of parsedMessages) {
      const isDuplicate = deduplicated.some(
        (existing) =>
          existing.id === msg.id ||
          (existing.senderRole === msg.senderRole &&
            existing.text.trim() === msg.text.trim() &&
            Math.abs(new Date(existing.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 15000)
      );
      if (!isDuplicate) {
        deduplicated.push(msg);
      }
    }

    // Update cache pada kedua key dengan pesan yang bersih dari duplikasi
    chatCache.set(cleanKey, deduplicated);
    chatCache.set(rawKey, deduplicated);
    if (withHash !== rawKey) chatCache.set(withHash, deduplicated);

    return { success: true, data: deduplicated, isTicketClosed: false };
  } catch (err: any) {
    console.error('getTicketChatMessagesAction error:', err);
    return {
      success: true,
      data: chatCache.get(complaintIdOrTiket) || [],
    };
  }
}

export async function sendTicketChatMessageAction(input: {
  complaintIdOrTiket: string;
  senderRole: 'WARGA' | 'PERSONIL';
  senderName: string;
  text: string;
  officerNrp?: string;
  token?: string;
}): Promise<{ success: boolean; data?: ChatMessageItem; error?: string }> {
  try {
    if (input.senderRole === 'PERSONIL') {
      const auth = await requireRole(['PERSONIL', 'SUPERADMIN', 'OPERATOR', 'PAWAS']);
      if (!auth.authorized) {
        return { success: false, error: auth.error };
      }
    } else if (input.senderRole === 'WARGA') {
      if (process.env.NODE_ENV !== 'production' && process.env.SIMAPRES_BYPASS_AUTH === 'true') {
        // Test environment bypass
      } else {
        const isValid = input.token ? verifyTrackingToken(input.complaintIdOrTiket, input.token) : false;
        if (!isValid) {
          return { success: false, error: 'Akses ditolak: Token autentikasi pelacakan warga tidak valid.' };
        }
      }
    }

    const cleanText = input.text?.trim();
    if (!cleanText) {
      return { success: false, error: 'Pesan tidak boleh kosong.' };
    }

    const rawKey = input.complaintIdOrTiket?.trim();
    if (!rawKey) {
      return { success: false, error: 'Nomor tiket tidak valid.' };
    }
    const cleanKey = rawKey.replace(/^#+/, '').trim();
    const withHash = `#${cleanKey}`;

    const chatRepo = UseCaseFactory.getChatRepository();

    // 1. Cari complaint di DB via domain repository
    const complaint = await chatRepo.findComplaintByKey(rawKey);

    // Jika tiket sudah selesai, tidak diizinkan mengirim pesan lagi
    if (complaint) {
      const statusUpper = (complaint.status || '').toUpperCase();
      if (statusUpper === 'SELESAI') {
        return { success: false, error: 'Tiket telah selesai ditangani. Sesi percakapan telah ditutup.' };
      }
    }

    const now = new Date();
    const newMsg: ChatMessageItem = {
      id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      senderRole: input.senderRole,
      senderName: input.senderName?.trim() || (input.senderRole === 'WARGA' ? 'Pelapor' : 'Petugas'),
      text: cleanText,
      timestamp: now.toISOString(),
      officerNrp: input.officerNrp || undefined,
    };

    // Optimistic cache update pada kedua key (raw & clean) agar instan tersinkronisasi
    const existingClean = (chatCache.get(cleanKey) || chatCache.get(rawKey) || []).filter(
      (m) =>
        !(
          m.senderRole === input.senderRole &&
          m.text.trim() === cleanText &&
          Math.abs(new Date(m.timestamp).getTime() - now.getTime()) < 5000
        )
    );
    const updatedMsgs = [...existingClean, newMsg];
    chatCache.set(cleanKey, updatedMsgs);
    chatCache.set(rawKey, updatedMsgs);
    if (withHash !== rawKey) chatCache.set(withHash, updatedMsgs);
    cacheInvalidate('tracking_');

    // Simpan ke database via repository
    if (complaint) {
      await chatRepo.saveMessage(complaint.id, newMsg);
    }

    return { success: true, data: newMsg };
  } catch (err: any) {
    console.error('sendTicketChatMessageAction error:', err);
    return { success: false, error: err.message || 'Gagal mengirim pesan.' };
  }
}

export async function clearTicketChatMessagesAction(
  complaintIdOrTiket: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const key = complaintIdOrTiket?.trim();
    if (!key) return { success: true };

    // 1. Clear memory cache
    chatCache.delete(key);
    cacheInvalidate('tracking_');

    // 2. Clear from DB via repository
    const chatRepo = UseCaseFactory.getChatRepository();
    const complaint = await chatRepo.findComplaintByKey(key);

    if (complaint) {
      await chatRepo.clearMessages(complaint.id);
    }

    return { success: true };
  } catch (err: any) {
    console.error('clearTicketChatMessagesAction error:', err);
    return { success: true };
  }
}
