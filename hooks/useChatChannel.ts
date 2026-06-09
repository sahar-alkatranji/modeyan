import { useCallback, useEffect, useRef, useState } from 'react';

// A normalized chat message shared by both order chat and support chat so the
// UI can render either the same way.
export interface ChatMessage {
  id: string | number;
  senderId: string;
  senderName?: string;
  text: string;
  createdAt?: string;
}

interface UseChatChannelOptions {
  // A stable identifier for the active conversation. `null` means "inactive"
  // (e.g. no chat selected) — the channel stays closed and empty.
  channelKey: string | null;
  // WebSocket URL for live updates, or null to use polling only.
  wsUrl: string | null;
  // Loads the full message history (already normalized).
  loadHistory: () => Promise<ChatMessage[]>;
  // Maps a raw WS payload to a normalized message (return null to ignore).
  parseWs: (raw: any) => ChatMessage | null;
  // Sends a message over the open socket (transport-specific framing).
  sendViaWs: (ws: WebSocket, text: string) => void;
  // Sends a message over REST and returns the created (normalized) message.
  sendViaRest: (text: string) => Promise<ChatMessage>;
  // Polling cadence used when the socket isn't connected.
  pollMs?: number;
}

interface UseChatChannelResult {
  messages: ChatMessage[];
  connected: boolean;       // true while the live socket is open
  error: string | null;
  sending: boolean;
  send: (text: string) => Promise<void>;
  reload: () => Promise<void>;
}

/**
 * Live chat transport with graceful degradation.
 *
 * Primary path: a WebSocket carries messages in real time. If the socket can't
 * be opened (or later drops — e.g. the dev proxy doesn't forward WS), the hook
 * automatically falls back to polling the REST history every `pollMs`. Outgoing
 * messages go over the socket when connected (so the backend broadcasts them to
 * the other party) and over REST otherwise. Messages are de-duplicated by id,
 * so the WS echo of our own message and any polling overlap never double-render.
 */
export function useChatChannel({
  channelKey,
  wsUrl,
  loadHistory,
  parseWs,
  sendViaWs,
  sendViaRest,
  pollMs = 5000,
}: UseChatChannelOptions): UseChatChannelResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const idsRef = useRef<Set<string>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep the latest callbacks in refs so the connect effect only re-runs when
  // the conversation (channelKey/wsUrl) actually changes.
  const loadRef = useRef(loadHistory);
  const parseRef = useRef(parseWs);
  const sendWsRef = useRef(sendViaWs);
  const sendRestRef = useRef(sendViaRest);
  loadRef.current = loadHistory;
  parseRef.current = parseWs;
  sendWsRef.current = sendViaWs;
  sendRestRef.current = sendViaRest;

  const mergeMany = useCallback((incoming: ChatMessage[]) => {
    if (incoming.length === 0) return;
    setMessages(prev => {
      let changed = false;
      const next = prev.slice();
      for (const m of incoming) {
        const key = String(m.id);
        if (!idsRef.current.has(key)) {
          idsRef.current.add(key);
          next.push(m);
          changed = true;
        }
      }
      if (!changed) return prev;
      next.sort((a, b) => {
        const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
        const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
        if (ta !== tb) return ta - tb;
        return Number(a.id) - Number(b.id);
      });
      return next;
    });
  }, []);

  const reload = useCallback(async () => {
    try {
      const history = await loadRef.current();
      mergeMany(history);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load messages');
    }
  }, [mergeMany]);

  useEffect(() => {
    // Reset everything for the newly-selected conversation.
    idsRef.current = new Set();
    setMessages([]);
    setConnected(false);
    setError(null);
    if (!channelKey) return;

    let disposed = false;

    const startPolling = () => {
      if (pollRef.current) return;
      pollRef.current = setInterval(() => { reload(); }, pollMs);
    };

    // Initial history load (works regardless of the socket).
    reload();

    if (wsUrl) {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        ws.onopen = () => { if (!disposed) setConnected(true); };
        ws.onmessage = (ev: MessageEvent) => {
          try {
            const raw = JSON.parse(ev.data);
            const msg = parseRef.current(raw);
            if (msg) mergeMany([msg]);
          } catch {
            /* ignore frames that aren't JSON */
          }
        };
        ws.onerror = () => { /* onclose handles the fallback */ };
        ws.onclose = () => {
          if (disposed) return;
          setConnected(false);
          startPolling();
        };
      } catch {
        startPolling();
      }
    } else {
      startPolling();
    }

    return () => {
      disposed = true;
      if (wsRef.current) {
        try { wsRef.current.close(); } catch { /* noop */ }
        wsRef.current = null;
      }
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelKey, wsUrl, pollMs, reload, mergeMany]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        // Backend echoes the message back over the socket; mergeMany de-dups it.
        sendWsRef.current(ws, trimmed);
      } else {
        const created = await sendRestRef.current(trimmed);
        mergeMany([created]);
      }
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to send message');
      throw e;
    } finally {
      setSending(false);
    }
  }, [mergeMany]);

  return { messages, connected, error, sending, send, reload };
}
