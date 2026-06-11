import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '../../hooks/useChatChannel';

interface ChatThreadProps {
  messages: ChatMessage[];
  currentUserId?: string;
  connected: boolean;
  sending: boolean;
  error: string | null;
  onSend: (text: string) => void | Promise<void>;
  language: 'en' | 'ar';
  disabled?: boolean;
  disabledNote?: string;
  emptyNote?: string;
  heightClass?: string;
}

const fmtTime = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Presentational chat thread: a scrolling bubble list plus a composer. Transport
// (WebSocket/polling/REST) is handled by useChatChannel; this is display only.
export const ChatThread: React.FC<ChatThreadProps> = ({
  messages,
  currentUserId,
  connected,
  sending,
  error,
  onSend,
  language,
  disabled = false,
  disabledNote,
  emptyNote,
  heightClass = 'h-[420px]',
}) => {
  const isAr = language === 'ar';
  const tr = (en: string, ar: string) => (isAr ? ar : en);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const submit = async () => {
    const text = draft.trim();
    if (!text || sending || disabled) return;
    setDraft('');
    try {
      await onSend(text);
    } catch {
      // keep the text so the user can retry
      setDraft(text);
    }
  };

  const isAiBot = (name?: string) => {
    if (!name) return false;
    const lower = name.toLowerCase();
    return lower.includes('ai') || lower.includes('المساعد') || lower.includes('الذكي') || lower.includes('bot');
  };

  return (
    <div className={`flex flex-col ${heightClass} bg-black/20 border border-white/10 rounded-2xl overflow-hidden`}>
      {/* Connection status */}
      <div className="flex items-center justify-end gap-2 px-4 py-2 border-b border-white/10 bg-white/5">
        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-amber-400'}`} />
        <span className="text-[11px] uppercase tracking-wider text-gray-400">
          {connected ? tr('Live', 'مباشر') : tr('Auto-refresh', 'تحديث تلقائي')}
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <p className="text-sm text-gray-500">{emptyNote || tr('No messages yet.', 'لا توجد رسائل بعد.')}</p>
          </div>
        ) : (
          messages.map(m => {
            const mine = !!currentUserId && String(m.senderId) === String(currentUserId);
            const isBot = isAiBot(m.senderName);
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
                  mine
                    ? 'bg-brand-gold/90 text-white rounded-br-sm'
                    : isBot
                      ? 'bg-blue-500/10 text-gray-100 border border-blue-400/20 rounded-bl-sm'
                      : 'bg-white/10 text-gray-100 border border-white/10 rounded-bl-sm'
                }`}>
                  {!mine && m.senderName && (
                    <p className={`text-[11px] font-bold mb-0.5 flex items-center gap-1.5 ${isBot ? 'text-blue-400' : 'text-brand-gold'}`}>
                      {isBot && (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )}
                      {isBot ? tr('AI Assistant', 'المساعد الذكي') : m.senderName}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{m.text}</p>
                  {m.createdAt && (
                    <p className={`text-[10px] mt-1 ${mine ? 'text-white/70' : 'text-gray-400'} text-end`}>{fmtTime(m.createdAt)}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && (
        <div className="px-4 py-1.5 text-xs text-red-400 bg-red-500/10 border-t border-red-500/20">{error}</div>
      )}

      {/* Composer */}
      <div className="border-t border-white/10 bg-white/5 p-3">
        {disabled ? (
          <p className="text-center text-xs text-gray-500 py-2">{disabledNote || tr('This conversation is closed.', 'تم إغلاق هذه المحادثة.')}</p>
        ) : (
          <div className="flex items-end gap-2">
            <input
              type="text"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
              placeholder={tr('Type a message…', 'اكتب رسالة…')}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
            />
            <button
              onClick={submit}
              disabled={sending || !draft.trim()}
              className="px-4 py-2.5 bg-brand-gold text-white text-sm font-bold uppercase tracking-wider rounded-xl hover:bg-yellow-600 transition-colors disabled:opacity-40 flex-shrink-0"
            >
              {sending ? tr('Sending…', 'جارٍ الإرسال…') : tr('Send', 'إرسال')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatThread;
