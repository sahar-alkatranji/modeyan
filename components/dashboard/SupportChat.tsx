import React, { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useChatChannel, ChatMessage } from '../../hooks/useChatChannel';
import {
  getSupportChats,
  getSupportChatDetail,
  createSupportChat,
  sendSupportMessage,
  claimSupportChat,
  supportChatWsUrl,
  getCurrentChatUser,
  SupportChatSummary,
  SupportMessage,
} from '../../services/chatApi';
import ChatThread from './ChatThread';
import { glassCardClass } from './DashboardShared';

type SupportMode = 'user' | 'admin';
type StatusFilter = 'all' | 'waiting' | 'active' | 'closed';

interface SupportChatProps {
  // Defaults to 'admin' for manager/support_agent, otherwise 'user'.
  mode?: SupportMode;
}

const normalize = (m: SupportMessage): ChatMessage => ({
  id: m.id,
  senderId: String(m.sender_id),
  senderName: m.sender_name,
  text: m.content,
  createdAt: m.created_at,
});

const STATUS_STYLE: Record<string, string> = {
  waiting: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  active: 'bg-green-500/20 text-green-300 border-green-500/30',
  closed: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

export const SupportChat: React.FC<SupportChatProps> = ({ mode }) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const tr = (en: string, ar: string) => (isAr ? ar : en);

  const me = getCurrentChatUser();
  const resolvedMode: SupportMode =
    mode || (me && (me.role === 'manager' || me.role === 'support_agent') ? 'admin' : 'user');

  const [chats, setChats] = useState<SupportChatSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('all');

  const [newSubject, setNewSubject] = useState('');
  const [creating, setCreating] = useState(false);

  const statusLabel = (s: string) =>
    s === 'waiting' ? tr('Waiting', 'بالانتظار')
    : s === 'active' ? tr('Active', 'نشط')
    : s === 'closed' ? tr('Closed', 'مغلق')
    : s;

  const loadList = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const status = resolvedMode === 'admin' && filter !== 'all' ? filter : undefined;
      const data = await getSupportChats(status);
      setChats(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setListError(e?.message || tr('Failed to load conversations', 'تعذّر تحميل المحادثات'));
    } finally {
      setLoadingList(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedMode, filter]);

  useEffect(() => { loadList(); }, [loadList]);

  const selected = chats.find(c => c.id === selectedId) || null;
  const isClosed = selected?.status === 'closed';

  const channel = useChatChannel({
    channelKey: selectedId ? String(selectedId) : null,
    wsUrl: selectedId ? supportChatWsUrl(selectedId) : null,
    loadHistory: async () => {
      if (!selectedId) return [];
      const detail = await getSupportChatDetail(selectedId);
      return (detail.messages || []).map(normalize);
    },
    parseWs: (raw) => (raw && raw.content != null ? normalize(raw) : null),
    sendViaWs: (ws, text) => ws.send(JSON.stringify({ content: text })),
    sendViaRest: async (text) => {
      const created = await sendSupportMessage(selectedId as number, text);
      return normalize(created);
    },
  });

  const openChat = (id: number) => {
    setSelectedId(id);
    // Opening marks messages read server-side; refresh the list shortly after
    // so unread badges clear.
    setTimeout(() => { loadList(); }, 400);
  };

  const handleCreate = async () => {
    const subject = newSubject.trim();
    if (!subject || creating) return;
    setCreating(true);
    try {
      const chat = await createSupportChat(subject);
      setNewSubject('');
      await loadList();
      if (chat?.id) setSelectedId(chat.id);
    } catch (e: any) {
      alert(e?.message || tr('Failed to start conversation', 'تعذّر بدء المحادثة'));
    } finally {
      setCreating(false);
    }
  };

  const handleClaim = async (id: number) => {
    try {
      await claimSupportChat(id);
      await loadList();
    } catch (e: any) {
      alert(e?.message || tr('Failed to claim conversation', 'تعذّر استلام المحادثة'));
    }
  };

  return (
    <div className="animate-fade-in text-start">
      <div className="mb-6">
        <h2 className="text-3xl font-serif text-white mb-1">
          {resolvedMode === 'admin' ? tr('Support Tickets', 'تذاكر الدعم') : tr('Support', 'الدعم')}
        </h2>
        <p className="text-sm text-gray-300">
          {resolvedMode === 'admin'
            ? tr('Respond to customer support conversations.', 'الرد على محادثات دعم العملاء.')
            : tr('Chat with our support team.', 'تواصل مع فريق الدعم لدينا.')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4">
        {/* ── Conversation list ── */}
        <aside className={glassCardClass + ' p-4 flex flex-col max-h-[520px]'}>
          {/* New conversation (customer only) */}
          {resolvedMode === 'user' && (
            <div className="mb-4 pb-4 border-b border-white/10">
              <p className="text-[11px] font-bold uppercase tracking-widest text-brand-gold mb-2">
                {tr('New conversation', 'محادثة جديدة')}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
                  placeholder={tr('Subject…', 'الموضوع…')}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white"
                />
                <button
                  onClick={handleCreate}
                  disabled={creating || !newSubject.trim()}
                  className="px-3 py-2 bg-brand-gold text-white text-xs font-bold uppercase rounded-xl hover:bg-yellow-600 transition-colors disabled:opacity-40 flex-shrink-0"
                >
                  {tr('Start', 'ابدأ')}
                </button>
              </div>
            </div>
          )}

          {/* Status filter (admin only) */}
          {resolvedMode === 'admin' && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {(['all', 'waiting', 'active', 'closed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                    filter === f ? 'bg-brand-gold text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {f === 'all' ? tr('All', 'الكل') : statusLabel(f)}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto -mx-1 px-1 custom-scrollbar">
            {loadingList ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-white/20 border-t-brand-gold rounded-full animate-spin" />
              </div>
            ) : listError ? (
              <p className="text-xs text-red-400 py-4">{listError}</p>
            ) : chats.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">
                {tr('No conversations yet.', 'لا توجد محادثات بعد.')}
              </p>
            ) : (
              <div className="space-y-1.5">
                {chats.map(c => (
                  <button
                    key={c.id}
                    onClick={() => openChat(c.id)}
                    className={`w-full text-start p-3 rounded-xl border transition-all ${
                      selectedId === c.id
                        ? 'bg-white/10 border-brand-gold/50'
                        : 'bg-white/5 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-bold text-white truncate">
                        {c.subject || tr('Conversation', 'محادثة') + ` #${c.id}`}
                      </span>
                      {!!c.unread_count && c.unread_count > 0 && (
                        <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-gold text-white text-[10px] font-bold flex items-center justify-center">
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                    {resolvedMode === 'admin' && c.customer_name && (
                      <p className="text-[11px] text-gray-400 truncate mb-1">{c.customer_name}</p>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${STATUS_STYLE[c.status] || 'bg-white/10 text-gray-300 border-white/10'}`}>
                        {statusLabel(c.status)}
                      </span>
                      {resolvedMode === 'admin' && c.status === 'waiting' && (
                        <span
                          onClick={(e) => { e.stopPropagation(); handleClaim(c.id); }}
                          className="text-[10px] font-bold uppercase text-brand-gold hover:underline cursor-pointer"
                        >
                          {tr('Claim', 'استلام')}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ── Thread ── */}
        <section>
          {selected ? (
            <>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-serif text-white truncate">
                    {selected.subject || tr('Conversation', 'محادثة') + ` #${selected.id}`}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {resolvedMode === 'admin'
                      ? (selected.customer_name || tr('Customer', 'العميل'))
                      : (selected.support_agent_name || tr('Support team', 'فريق الدعم'))}
                    {' · '}{statusLabel(selected.status)}
                  </p>
                </div>
                {resolvedMode === 'admin' && selected.status === 'waiting' && (
                  <button
                    onClick={() => handleClaim(selected.id)}
                    className="px-3 py-1.5 bg-brand-gold text-white text-xs font-bold uppercase rounded-lg hover:bg-yellow-600 transition-colors flex-shrink-0"
                  >
                    {tr('Claim', 'استلام')}
                  </button>
                )}
              </div>
              <ChatThread
                messages={channel.messages}
                currentUserId={me?.id}
                connected={channel.connected}
                sending={channel.sending}
                error={channel.error}
                onSend={channel.send}
                language={language}
                disabled={isClosed}
                disabledNote={tr('This conversation is closed.', 'تم إغلاق هذه المحادثة.')}
                heightClass="h-[460px]"
              />
            </>
          ) : (
            <div className={glassCardClass + ' h-[460px] flex items-center justify-center'}>
              <p className="text-sm text-gray-500">
                {tr('Select a conversation to view messages.', 'اختر محادثة لعرض الرسائل.')}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SupportChat;
