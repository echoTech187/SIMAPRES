'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, CheckCircle2 } from 'lucide-react';
import {
  getTicketChatMessagesAction,
  sendTicketChatMessageAction,
} from '@/app/actions/chat.actions';
import type { ChatMessageItem } from '@/types/chat.types';
import type { ComplaintData, OfficerProfile } from '../types';
import { formatPhoneNumber } from '../types';

interface PersonilChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: ComplaintData | null;
  officer: OfficerProfile;
}

export default function PersonilChatDrawer({
  isOpen,
  onClose,
  complaint,
  officer,
}: PersonilChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTicketClosed, setIsTicketClosed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ticketId = complaint?.nomorTiket || (complaint?.id ? String(complaint.id) : '');

  // Status tiket selesai penanganan
  const isFinished =
    isTicketClosed ||
    (complaint?.status || '').toUpperCase() === 'SELESAI';

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch messages
  const loadMessages = async () => {
    if (!ticketId) return;
    try {
      const res = await getTicketChatMessagesAction(ticketId);
      if (res.success) {
        if (res.isTicketClosed) {
          setIsTicketClosed(true);
          setMessages([]);
        } else if (res.data) {
          setIsTicketClosed(false);
          setMessages(res.data);
        }
      }
    } catch (e) {
      console.warn('Failed loading chat messages:', e);
    }
  };

  useEffect(() => {
    if (isOpen && ticketId && !isFinished) {
      loadMessages();
      const interval = setInterval(() => {
        if (typeof document !== 'undefined' && document.hidden) return;
        loadMessages();
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen, ticketId, isFinished]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !ticketId || isSending) return;

    const textToSend = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);

    const tempMsg: ChatMessageItem = {
      id: `temp-${Date.now()}`,
      senderRole: 'PERSONIL',
      senderName: officer.fullName || 'Petugas Lapangan',
      text: textToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await sendTicketChatMessageAction({
        complaintIdOrTiket: ticketId,
        senderRole: 'PERSONIL',
        senderName: officer.fullName ,
        text: textToSend,
        officerNrp: officer.nrp,
      });

      if (res.success && res.data) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempMsg.id ? res.data! : m))
        );
      }
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setIsSending(false);
      scrollToBottom();
    }
  };

  if (!isOpen || !complaint) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container (Tinggi Minimal 80vh Sesuai Kebutuhan Lapangan) */}
      <div
        className="relative w-full sm:max-w-xl h-[80vh] min-h-[80vh] max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden z-10 transition-all duration-300"
        style={{
          background: 'linear-gradient(180deg, #151821 0%, #0E1017 100%)',
          border: '1.5px solid rgba(236, 196, 115, 0.35)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 25px rgba(236, 196, 115, 0.15)',
        }}
      >
        {/* Drawer Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b flex-shrink-0"
          style={{
            borderColor: 'rgba(236, 196, 115, 0.15)',
            background: 'rgba(20, 24, 34, 0.95)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-amber-300"
              style={{
                background: 'rgba(236, 196, 115, 0.15)',
                border: '1px solid rgba(236, 196, 115, 0.3)',
              }}
            >
              <MessageSquare size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-100">
                  Chat dengan Pelapor
                </h3>
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                  {complaint.nomorTiket}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate max-w-[220px]">
                Pelapor: <strong className="text-slate-200">{complaint.pelaporNama || 'Warga'}</strong>
                {(() => {
                  const pPhone = formatPhoneNumber(complaint.pelaporTelepon || complaint.pelaporHp || complaint.pelapor_hp);
                  return pPhone ? ` (${pPhone})` : '';
                })()}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tactical Info Ribbon */}
        <div
          className="px-5 py-2 text-[11px] flex items-center justify-between border-b flex-shrink-0"
          style={{
            background: 'rgba(236, 196, 115, 0.06)',
            borderColor: 'rgba(236, 196, 115, 0.12)',
          }}
        >
          <span className="text-amber-200/90 font-medium truncate">
            📍 TKP: {complaint.tkpAlamatTeks || 'Lokasi Kejadian'}
          </span>
          {isFinished ? (
            <span className="text-[10px] font-bold text-slate-400 bg-white/10 border border-white/20 px-2 py-0.5 rounded-full flex-shrink-0">
              ● SESI DITUTUP
            </span>
          ) : (
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full flex-shrink-0">
              ● TERHUBUNG
            </span>
          )}
        </div>

        {/* Chat Messages Body (Mengisi Penuh Tinggi 80vh) */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(236, 196, 115, 0.3) transparent',
          }}
        >
          {isFinished ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center text-slate-400 space-y-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1"
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                }}
              >
                <CheckCircle2 size={24} className="text-emerald-400" />
              </div>
              <p className="text-xs font-bold text-slate-200">
                Penanganan Tiket {complaint.nomorTiket?.replace(/^#+/, '')} Selesai
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                Tugas telah selesai ditangani. Sesi percakapan antara petugas dan pelapor telah ditutup secara otomatis sesuai SOP kedinasan.
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center text-slate-400">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                style={{
                  background: 'rgba(236, 196, 115, 0.1)',
                  border: '1px solid rgba(236, 196, 115, 0.25)',
                }}
              >
                <MessageSquare size={22} className="text-amber-300" />
              </div>
              <p className="text-xs font-semibold text-slate-300">
                Belum ada pesan komunikasi.
              </p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                Kirim pesan untuk memberi tahu pelapor bahwa regu patroli sedang merespons dan menuju lokasi.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOfficer = msg.senderRole === 'PERSONIL';
              const isSystem = msg.senderRole === 'SISTEM';

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/50">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isOfficer ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-bold text-slate-400">
                      {isOfficer ? 'Personil Lapangan' : msg.senderName || 'Pelapor'}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {msg.timestamp
                        ? new Date(msg.timestamp).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                  </div>

                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-[13px] leading-relaxed ${
                      isOfficer
                        ? 'rounded-tr-none text-slate-900 font-semibold'
                        : 'rounded-tl-none text-slate-100'
                    }`}
                    style={{
                      background: isOfficer
                        ? 'linear-gradient(135deg, #ECC473 0%, #D4A346 100%)'
                        : 'rgba(30, 35, 48, 0.95)',
                      border: isOfficer
                        ? 'none'
                        : '1px solid rgba(255, 255, 255, 0.12)',
                      boxShadow: isOfficer
                        ? '0 4px 14px rgba(212, 163, 70, 0.25)'
                        : '0 2px 8px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar atau Info Selesai */}
        {isFinished ? (
          <div className="p-4 border-t border-white/10 bg-black/40 text-center text-xs text-slate-400 font-medium">
            Sesi percakapan ditutup karena tugas telah selesai.
          </div>
        ) : (
          <>
            {/* Quick Responses */}
            <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto border-t border-slate-800/80 bg-black/20">
              {[
                'Petugas sedang meluncur ke lokasi.',
                'Mohon tetap di tempat aman.',
                'Kami sudah tiba di dekat TKP.',
              ].map((quick, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInputMessage(quick)}
                  className="text-[10px] font-semibold text-amber-200/90 whitespace-nowrap px-2.5 py-1 rounded-full border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                >
                  {quick}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2 p-3 sm:p-4 border-t"
              style={{
                borderColor: 'rgba(236, 196, 115, 0.15)',
                background: 'rgba(18, 21, 29, 0.98)',
              }}
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Tulis pesan untuk pelapor..."
                className="flex-1 bg-black/40 text-slate-100 placeholder-slate-500 text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-amber-500/25 focus:outline-none focus:border-amber-400 transition-colors"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isSending}
                className="px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #ECC473 0%, #D4A346 100%)',
                  color: '#0B0D12',
                  boxShadow: '0 2px 10px rgba(212, 163, 70, 0.35)',
                }}
              >
                <span>Kirim</span>
                <Send size={14} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
