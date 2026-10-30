/**
 * SIMAPRES 110 - INFRASTRUCTURE REPOSITORY: TACTICAL DISPATCH CHAT
 * Lapisan: Infrastructure (Prisma Implementation)
 */

import { prisma } from '../db/prisma.client';
import { IChatRepository } from '@/domain/repositories/chat.repository.interface';
import { ChatMessageItem } from '@/types/chat.types';

export class PrismaChatRepository implements IChatRepository {
  private isTableInitialized = false;

  async ensureChatTable(): Promise<void> {
    if (this.isTableInitialized) return;
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
      this.isTableInitialized = true;
    } catch (err) {
      console.warn('ensureComplaintChatTableExists warning:', err);
    }
  }

  async findComplaintByKey(key: string): Promise<{ id: bigint; status: string; nomor_tiket: string } | null> {
    const rawKey = key.trim();
    const cleanKey = rawKey.replace(/^#+/, '').trim();
    const withHash = `#${cleanKey}`;

    if (/^\d+$/.test(rawKey)) {
      return await prisma.complaint.findFirst({
        where: { id: BigInt(rawKey) },
        select: { id: true, status: true, nomor_tiket: true },
      });
    }

    return await prisma.complaint.findFirst({
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

  async getMessagesByComplaintId(complaintId: bigint): Promise<ChatMessageItem[]> {
    const parsedMessages: ChatMessageItem[] = [];
    try {
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id, sender_role, sender_name, officer_nrp, message_text, created_at
         FROM complaint_chats
         WHERE complaint_id = ?
         ORDER BY created_at ASC`,
        complaintId
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
    return parsedMessages;
  }

  async getLegacyAuditMessages(complaintId: bigint): Promise<ChatMessageItem[]> {
    const parsedMessages: ChatMessageItem[] = [];
    try {
      const legacyLogs = await prisma.complaintAuditLog.findMany({
        where: {
          complaint_id: complaintId,
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
    return parsedMessages;
  }

  async saveMessage(complaintId: bigint, msg: ChatMessageItem): Promise<void> {
    await this.ensureChatTable();
    const now = new Date(msg.timestamp || Date.now());
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO complaint_chats (complaint_id, sender_role, sender_name, officer_nrp, message_text, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        complaintId,
        msg.senderRole,
        msg.senderName,
        msg.officerNrp || null,
        msg.text,
        now
      );
    } catch (insertErr) {
      console.warn('Failed inserting to complaint_chats table, using audit log fallback:', insertErr);
      const jsonPayload = JSON.stringify({
        text: msg.text,
        senderRole: msg.senderRole,
        senderName: msg.senderName,
        timestamp: msg.timestamp,
        officerNrp: msg.officerNrp || undefined,
      });
      await prisma.complaintAuditLog.create({
        data: {
          complaint_id: complaintId,
          actor_name: msg.senderName,
          actor_role: msg.senderRole,
          action: 'CHAT_MESSAGE',
          notes: jsonPayload,
        },
      });
    }
  }

  async clearMessages(complaintId: bigint): Promise<void> {
    await this.ensureChatTable();
    try {
      await prisma.$executeRawUnsafe(
        `DELETE FROM complaint_chats WHERE complaint_id = ?`,
        complaintId
      );
    } catch (_) {}
  }
}
