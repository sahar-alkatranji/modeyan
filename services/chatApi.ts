// Self-contained chat API helpers (TASK 5 — Order Chat & Support Chat).
//
// Deliberately kept independent of services/api.ts so these chat files can be
// added without editing the shared API client (which is being changed
// concurrently). It reuses the exact auth token the main client stores
// (localStorage 'modeya_token') and hits the same '/api/v1' proxy base, so it
// behaves identically with respect to authentication.

const API_BASE = '/api/v1';

function getToken(): string | null {
  try {
    return localStorage.getItem('modeya_token');
  } catch {
    return null;
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (typeof body?.detail === 'string') detail = body.detail;
      else if (Array.isArray(body?.detail)) detail = body.detail.map((d: any) => d?.msg).filter(Boolean).join('. ') || detail;
    } catch { /* non-JSON error body */ }
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

// Build a ws:// or wss:// URL with the auth token as a query param. The backend
// WS endpoints authenticate via `?token=...`. Returns null when unauthenticated.
//
// NOTE (dev): Vite only proxies `/api` and `/storage` over HTTP. To make the
// WebSocket transport work through the dev server, add `ws: true` to the `/api`
// proxy and a `/ws` proxy entry in vite.config.ts. Without that, the hook
// transparently falls back to REST polling, so chat still works either way.
export function chatWsUrl(path: string): string | null {
  const token = getToken();
  if (!token) return null;
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const sep = path.includes('?') ? '&' : '?';
  return `${proto}//${window.location.host}${path}${sep}token=${encodeURIComponent(token)}`;
}

// Identify the logged-in user from the cached profile the auth layer stores.
export interface ChatCurrentUser {
  id: string;
  role: string;
  name: string;
}
export function getCurrentChatUser(): ChatCurrentUser | null {
  try {
    const raw = localStorage.getItem('modeya_user');
    if (!raw) return null;
    const u = JSON.parse(raw);
    if (u?.id == null) return null;
    return {
      id: String(u.id),
      role: String(u.role || 'customer'),
      name: [u.first_name, u.last_name].filter(Boolean).join(' ').trim(),
    };
  } catch {
    return null;
  }
}

// ───────────────────────────── Order chat ─────────────────────────────
// Per-order messages between a customer and the assigned tailor.
export interface OrderMessage {
  id: number;
  order_id: number;
  sender_id: number;
  sender_name?: string;
  message: string;
  is_read?: boolean;
  created_at?: string;
}

export const getOrderMessages = (orderId: number | string) =>
  apiFetch<OrderMessage[]>(`/orders/${orderId}/messages`);

export const sendOrderMessage = (orderId: number | string, message: string) =>
  apiFetch<OrderMessage>(`/orders/${orderId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });

// Order chat WS lives outside the /api prefix: /ws/chat/{order_id}. It expects
// raw text frames (the message body) and broadcasts JSON OrderMessage objects.
export const orderChatWsUrl = (orderId: number | string) => chatWsUrl(`/ws/chat/${orderId}`);

// ──────────────────────────── Support chat ────────────────────────────
// Customer support tickets between a customer and a support agent / manager.
export interface SupportMessage {
  id: number;
  chat_id: number;
  sender_id: number;
  sender_name?: string;
  sender_role?: string;
  content: string;
  attachment_url?: string | null;
  is_read?: boolean;
  created_at?: string;
}

export interface SupportChatSummary {
  id: number;
  customer_id: number;
  customer_name?: string;
  support_agent_id?: number | null;
  support_agent_name?: string | null;
  status: string; // waiting | active | closed
  subject?: string | null;
  created_at?: string;
  closed_at?: string | null;
  unread_count?: number;
  last_message?: SupportMessage | null;
}

export interface SupportChatDetail {
  chat: SupportChatSummary;
  messages: SupportMessage[];
}

export const getSupportChats = (status?: string) =>
  apiFetch<SupportChatSummary[]>(`/support/chats${status ? `?status=${encodeURIComponent(status)}` : ''}`);

export const getSupportChatDetail = (chatId: number | string) =>
  apiFetch<SupportChatDetail>(`/support/chats/${chatId}`);

export const createSupportChat = (subject: string) =>
  apiFetch<SupportChatSummary>(`/support/chats`, {
    method: 'POST',
    body: JSON.stringify({ subject }),
  });

export const sendSupportMessage = (chatId: number | string, content: string) =>
  apiFetch<SupportMessage>(`/support/chats/${chatId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });

export const claimSupportChat = (chatId: number | string) =>
  apiFetch<SupportChatSummary>(`/support/chats/${chatId}/claim`, { method: 'POST' });

// Support chat WS is under the /api/v1/support prefix and expects JSON frames
// of the shape { content, attachment_url? }.
export const supportChatWsUrl = (chatId: number | string) =>
  chatWsUrl(`/api/v1/support/ws/support/${chatId}`);
