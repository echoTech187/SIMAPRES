import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTicketChatMessagesAction } from '../chat.actions';
import { prisma } from '@/infrastructure/db/prisma.client';

describe('Server Action Integration: chat.actions (Tactical Dispatch Chat)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getTicketChatMessagesAction: returns empty array when ticket key is empty', async () => {
    const result = await getTicketChatMessagesAction('');
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it('getTicketChatMessagesAction: queries complaint_chats table and returns messages', async () => {
    (prisma as any).$executeRawUnsafe = vi.fn().mockResolvedValue(1);
    vi.spyOn(prisma.complaint, 'findFirst').mockResolvedValue({
      id: BigInt(100),
      nomor_tiket: 'TICKET-20261030-9999',
      status: 'DIPROSES',
    } as any);

    const mockMessages = [
      {
        id: BigInt(1),
        complaint_id: BigInt(100),
        sender_role: 'OPERATOR',
        sender_name: 'Briptu Danang',
        officer_nrp: '8801',
        message_text: 'Unit patroli segera meluncur',
        created_at: new Date('2026-10-30T01:00:00Z'),
      },
    ];
    (prisma as any).$queryRawUnsafe = vi.fn().mockResolvedValue(mockMessages);

    const result = await getTicketChatMessagesAction('TICKET-20261030-9999');

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.length).toBe(1);
    expect(result.data[0].senderName).toBe('Briptu Danang');
    expect(result.data[0].text).toBe('Unit patroli segera meluncur');
  });
});
