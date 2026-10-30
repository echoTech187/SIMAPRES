'use client';

import React, { useRef } from 'react';
import NameInitialAvatar from '@/components/ui/NameInitialAvatar';
import { X, MessageSquare, Send } from 'lucide-react';
import type { ChatMessageItem } from '@/types/chat.types';

export interface ChatBottomDrawerProps {
  officer: any;
  messages: ChatMessageItem[];
  input: string;
  sending: boolean;
  onInputChange: (val: string) => void;
  onSend: (e?: React.FormEvent, customText?: string) => void;
  onClose: () => void;
  chatEndRef: any;
}

export default function ChatBottomDrawer({
  officer,
  messages,
  input,
  sending,
  onInputChange,
  onSend,
  onClose,
  chatEndRef,
}: ChatBottomDrawerProps) {
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchEndY - touchStartY.current;
    if (diff > 50) {
      onClose();
    }
    touchStartY.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end items-center">
      {/* Semi-transparent dark blur backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      />

      {/* Drawer Container */}
      <div
        className="relative w-full max-w-xl h-[82dvh] max-h-[720px] bg-[#121621] border-t-2 border-x border-amber-500/35 rounded-t-3xl flex flex-col shadow-2xl overflow-hidden z-10"
        style={{
          animation: 'clt-drawer-slide 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Swipe Pill Handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={onClose}
          className="flex justify-center pt-2.5 pb-1.5 cursor-pointer group"
        >
          <div className="w-12 h-1.5 rounded-full bg-white/30 group-hover:bg-amber-400 transition-colors" />
        </div>

        {/* Drawer Header */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between bg-[#121621]"
        >
          <div className="flex items-center gap-3">
            <NameInitialAvatar
              name={officer?.namaLengkap}
              avatarUrl={officer?.avatarUrl}
              size={36}
              showOnlineDot={true}
              statusColor="#10B981"
              variant="gold"
            />
            <div>
              <div className="text-xs font-black text-white leading-tight">
                {officer?.namaLengkap || 'Petugas Lapangan'}
              </div>
              <div className="text-[10px] text-amber-300 font-bold mt-0.5">
                {officer?.rankPangkat || 'POLRI'} · {officer?.unitName || '110 Patroli'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Chat"
            className="w-8 h-8 rounded-full bg-white/5 border border-amber-500/25 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Tactical Info Strip */}
        <div className="bg-black/50 py-1.5 px-3 border-b border-white/5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-semibold">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Koneksi Langsung Terhubung ke Handset Personil</span>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-slate-400 text-xs my-auto py-8">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3 text-amber-300">
                <MessageSquare size={20} />
              </div>
              <p className="font-extrabold text-slate-200 text-sm mb-1">Ruang Chat Terbuka</p>
              <p className="text-slate-400 max-w-xs mx-auto leading-relaxed">
                Kirim informasi patokan lokasi atau kondisi terkini untuk mempermudah personil merapat.
              </p>
            </div>
          ) : (
            messages.map((msg: ChatMessageItem) => {
              const isMe = msg.senderRole === 'WARGA';
              return (
                <div
                  key={msg.id}
                  className={`max-w-[82%] ${isMe ? 'ml-auto text-right' : 'mr-auto text-left'}`}
                >
                  <div className={`text-[10px] font-bold mb-0.5 ${isMe ? 'text-amber-300' : 'text-blue-400'}`}>
                    {isMe ? 'Anda (Pelapor)' : msg.senderName || 'Petugas Lapangan'}
                  </div>
                  <div
                    className={`p-2.5 rounded-2xl text-xs break-words shadow-sm ${isMe
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold rounded-tr-sm'
                      : 'bg-[#1A1F2C] text-slate-100 border border-amber-500/20 rounded-tl-sm font-medium'
                      }`}
                  >
                    {msg.text}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Presets */}
        <div className="flex gap-1.5 overflow-x-auto p-2.5 border-t border-white/5 bg-black/40 scrollbar-none">
          {[
            'Saya di depan gerbang.',
            'Saya memakai baju merah.',
            'Kondisi aman, silakan merapat.',
            'Lokasi saya sesuai titik GPS.',
            'Tolong bunyikan sirine saat dekat.',
          ].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onSend(undefined, t)}
              className="bg-amber-500/10 border border-amber-500/25 text-amber-300 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap flex-shrink-0 hover:bg-amber-500/20 transition-colors"
            >
              {t}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={onSend} className="p-3 border-t border-white/10 bg-[#0D1017] flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Ketik pesan untuk petugas..."
            autoFocus
            className="flex-1 bg-black/50 border border-amber-500/25 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400 transition-colors"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="px-4 rounded-xl font-black text-xs flex items-center justify-center transition-all disabled:opacity-40"
            style={{
              background: input.trim() ? 'linear-gradient(135deg,#ECC473,#C99635)' : 'rgba(255,255,255,0.06)',
              color: input.trim() ? '#0A0D14' : '#64748B',
            }}
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
