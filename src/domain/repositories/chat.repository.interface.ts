/**
 * SIMAPRES 110 - DOMAIN REPOSITORY INTERFACE: TACTICAL DISPATCH CHAT
 * Lapisan: Domain (Pure TypeScript, Zero Framework Dependency)
 */

import { ChatMessageItem } from '@/types/chat.types';

export interface IChatRepository {
  ensureChatTable(): Promise<void>;
  findComplaintByKey(key: string): Promise<{ id: bigint; status: string; nomor_tiket: string } | null>;
  getMessagesByComplaintId(complaintId: bigint): Promise<ChatMessageItem[]>;
  getLegacyAuditMessages(complaintId: bigint): Promise<ChatMessageItem[]>;
  saveMessage(complaintId: bigint, msg: ChatMessageItem): Promise<void>;
  clearMessages(complaintId: bigint): Promise<void>;
}
