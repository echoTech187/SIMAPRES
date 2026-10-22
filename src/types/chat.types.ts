export interface ChatMessageItem {
  id: string;
  senderRole: 'WARGA' | 'PERSONIL' | 'SISTEM';
  senderName: string;
  text: string;
  timestamp: string;
  officerNrp?: string;
}
