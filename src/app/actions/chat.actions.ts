'use server';

import { prisma } from '@/infrastructure/db/prisma.client';
import type { ChatMessageItem } from '@/types/chat.types';

// In-memory fallback / quick cache for ultra-responsive low-latency chat
const chatCache = new Map<string, ChatMessageItem[]>();

let isTableInitialized = false;

/**
 * Memastikan tabel terdedikasi `complaint_chats` telah dibuat di MySQL/MariaDB
 * agar percakapan warga dan personel terpisah bersih dari tabel audit log umum.
 */
async function ensureComplaintChatTableExists() {
  if (isTableInitialized) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`complaint_chats\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`complaint_id\` BIGINT NOT NULL,
        \`sender_role\` VARCHAR(20) NOT NULL,
        \`sender_name\` VARCHAR(120) NOT NULL,
        \`officer_nrp\` VARCHAR(50) NULL,
        \`message_text\` TEXT NOT NULL,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        INDEX \`idx_complaint_chats_cid_created\` (\`complaint_id\`, \`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    isTableInitialized = true;
  } catch (err) {
    console.warn('ensureComplaintChatTableExists warning:', err);
  }
}

export async function getTicketChatMessagesAction(
  complaintIdOrTiket: string
): Promise<{ success: boolean; data: ChatMessageItem[]; isTicketClosed?: boolean; error?: string }> {
  try {
    if (!complaintIdOrTiket) {
      return { success: true, data: [] };
    }

    const rawKey = complaintIdOrTiket.trim();
    const cleanKey = rawKey.replace(/^#+/, '').trim();
    const withHash = `#${cleanKey}`;

    // 1. Cari data tiket dan periksa status siklus penanganan (fleksibel dengan/tanpa '#')
    let complaint: { id: bigint; status: string; nomor_tiket: string } | null = null;
    if (/^\d+$/.test(rawKey)) {
      complaint = await prisma.complaint.findFirst({
        where: { id: BigInt(rawKey) },
        select: { id: true, status: true, nomor_tiket: true },
      });
    } else {
      complaint = await prisma.complaint.findFirst({
        where: {
          OR: [
            { nomor_tiket: rawKey },
            { nomor_tiket: cleanKey },
            { nomor_tiket: withHash },
          ],
        },
        select: { id: true, status: true, nomor_tiket: true },
      });
    }

    if (!complaint) {
      // Tiket belum terdaftar di DB, ambil dari cache memori jika ada
      return { success: true, data: chatCache.get(cleanKey) || chatCache.get(rawKey) || [] };
    }

    // 2. Jika tiket / pengaduan SUDAH SELESAI, riwayat chat tidak perlu lagi ditampilkan
    // Data tetap tersimpan aman di tabel `complaint_chats` untuk audit kepolisian
    const statusUpper = (complaint.status || '').toUpperCase();
    if (statusUpper === 'SELESAI' || statusUpper === 'SELESAI_PENANGANAN') {
      return {
        success: true,
        data: [],
        isTicketClosed: true,
      };
    }

    await ensureComplaintChatTableExists();

    // 3. Ambil riwayat chat dari tabel terdedikasi `complaint_chats`
    const parsedMessages: ChatMessageItem[] = [];

    try {
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id, sender_role, sender_name, officer_nrp, message_text, created_at
         FROM complaint_chats
         WHERE complaint_id = ?
         ORDER BY created_at ASC`,
        complaint.id
      );

      if (Array.isArray(rows) && rows.length > 0) {
        for (const row of rows) {
          parsedMessages.push({
            id: row.id.toString(),
            senderRole: row.sender_role === 'WARGA' ? 'WARGA' : 'PERSONIL',
            senderName: row.sender_name,
            text: row.message_text,
            timestamp: new Date(row.created_at).toISOString(),
            officerNrp: row.officer_nrp || undefined,
          });
        }
      }
    } catch (dbErr) {
      console.warn('Error querying complaint_chats, falling back to audit logs:', dbErr);
    }

    // 4. Jika di tabel complaint_chats belum ada pesan (migrasi/legacy dev), cek complaint_audit_logs
    if (parsedMessages.length === 0) {
      try {
        const legacyLogs = await prisma.complaintAuditLog.findMany({
          where: {
            complaint_id: complaint.id,
            action: 'CHAT_MESSAGE',
          },
          orderBy: { created_at: 'asc' },
        });

        for (const log of legacyLogs) {
          let text = log.notes || '';
          let role: 'WARGA' | 'PERSONIL' | 'SISTEM' =
            log.actor_role === 'WARGA' ? 'WARGA' : 'PERSONIL';
          let name = log.actor_name || (role === 'WARGA' ? 'Pelapor' : 'Personil Lapangan');
          let ts = log.created_at.toISOString();

          try {
            if (text.startsWith('{') && text.endsWith('}')) {
              const parsed = JSON.parse(text);
              if (parsed.text) text = parsed.text;
              if (parsed.senderRole) role = parsed.senderRole;
              if (parsed.senderName) name = parsed.senderName;
              if (parsed.timestamp) ts = parsed.timestamp;
            }
          } catch (_) {}

          parsedMessages.push({
            id: log.id.toString(),
            senderRole: role,
            senderName: name,
            text,
            timestamp: ts,
          });
        }
      } catch (_) {}
    }

    // 5. Gabungkan dengan cache in-memory untuk pesan ultra-responsif
    const cached = chatCache.get(cleanKey) || chatCache.get(rawKey) || [];
    const dbIds = new Set(parsedMessages.map((m) => m.id));
    for (const c of cached) {
      if (!dbIds.has(c.id)) {
        parsedMessages.push(c);
      }
    }

    // Urutkan berdasarkan waktu
    parsedMessages.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Update cache pada kedua key
    chatCache.set(cleanKey, parsedMessages);
    chatCache.set(rawKey, parsedMessages);
    if (withHash !== rawKey) chatCache.set(withHash, parsedMessages);

    return { success: true, data: parsedMessages, isTicketClosed: false };
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
}): Promise<{ success: boolean; data?: ChatMessageItem; error?: string }> {
  try {
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

    // 1. Cari complaint di DB (fleksibel dengan/tanpa '#')
    let complaint: { id: bigint; status: string; nomor_tiket: string } | null = null;
    if (/^\d+$/.test(rawKey)) {
      complaint = await prisma.complaint.findFirst({
        where: { id: BigInt(rawKey) },
        select: { id: true, status: true, nomor_tiket: true },
      });
    } else {
      complaint = await prisma.complaint.findFirst({
        where: {
          OR: [
            { nomor_tiket: rawKey },
            { nomor_tiket: cleanKey },
            { nomor_tiket: withHash },
          ],
        },
        select: { id: true, status: true, nomor_tiket: true },
      });
    }

    // Jika tiket sudah selesai, tidak diizinkan mengirim pesan lagi
    if (complaint) {
      const statusUpper = (complaint.status || '').toUpperCase();
      if (statusUpper === 'SELESAI' || statusUpper === 'SELESAI_PENANGANAN') {
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
    const existingClean = chatCache.get(cleanKey) || chatCache.get(rawKey) || [];
    const updatedMsgs = [...existingClean, newMsg];
    chatCache.set(cleanKey, updatedMsgs);
    chatCache.set(rawKey, updatedMsgs);
    if (withHash !== rawKey) chatCache.set(withHash, updatedMsgs);

    // Simpan ke tabel terdedikasi `complaint_chats`
    if (complaint) {
      await ensureComplaintChatTableExists();
      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO complaint_chats (complaint_id, sender_role, sender_name, officer_nrp, message_text, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          complaint.id,
          input.senderRole,
          newMsg.senderName,
          input.officerNrp || null,
          cleanText,
          now
        );
      } catch (insertErr) {
        console.warn('Failed inserting to complaint_chats table, using audit log fallback:', insertErr);
        // Fallback simpan ke audit log jika executeRaw belum siap
        const jsonPayload = JSON.stringify({
          text: cleanText,
          senderRole: input.senderRole,
          senderName: newMsg.senderName,
          timestamp: newMsg.timestamp,
          officerNrp: input.officerNrp || undefined,
        });
        await prisma.complaintAuditLog.create({
          data: {
            complaint_id: complaint.id,
            actor_name: newMsg.senderName,
            actor_role: input.senderRole,
            action: 'CHAT_MESSAGE',
            notes: jsonPayload,
          },
        });
      }
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

    // 2. Clear from DB
    let complaintIdBig: bigint | null = null;
    if (/^\d+$/.test(key)) {
      complaintIdBig = BigInt(key);
    } else {
      const found = await prisma.complaint.findFirst({
        where: { nomor_tiket: key },
        select: { id: true },
      });
      if (found) complaintIdBig = found.id;
    }

    if (complaintIdBig) {
      await ensureComplaintChatTableExists();
      try {
        await prisma.$executeRawUnsafe(
          `DELETE FROM complaint_chats WHERE complaint_id = ?`,
          complaintIdBig
        );
      } catch (_) {}
    }

    return { success: true };
  } catch (err: any) {
    console.error('clearTicketChatMessagesAction error:', err);
    return { success: true };
  }
}
