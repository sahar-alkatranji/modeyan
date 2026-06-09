import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useChatChannel, ChatMessage } from '../../hooks/useChatChannel';
import {
  getOrderMessages,
  sendOrderMessage,
  orderChatWsUrl,
  getCurrentChatUser,
  OrderMessage,
} from '../../services/chatApi';
import ChatThread from './ChatThread';

interface OrderChatProps {
  orderId: number | string;
  // Optional — falls back to the cached logged-in user so the component is
  // usable standalone (e.g. embedded in OrderDetailModal or a dashboard view).
  currentUserId?: string;
  title?: string;
}

const normalize = (m: OrderMessage): ChatMessage => ({
  id: m.id,
  senderId: String(m.sender_id),
  senderName: m.sender_name,
  text: m.message,
  createdAt: m.created_at,
});

// Per-order chat between the customer and the assigned tailor. Live over a
// WebSocket, with automatic REST-polling fallback (see useChatChannel).
export const OrderChat: React.FC<OrderChatProps> = ({ orderId, currentUserId, title }) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const me = currentUserId || getCurrentChatUser()?.id;

  const { messages, connected, error, sending, send } = useChatChannel({
    channelKey: String(orderId),
    wsUrl: orderChatWsUrl(orderId),
    loadHistory: async () => (await getOrderMessages(orderId)).map(normalize),
    parseWs: (raw) => (raw && raw.message != null ? normalize(raw) : null),
    sendViaWs: (ws, text) => ws.send(text), // order WS expects a raw text frame
    sendViaRest: async (text) => normalize(await sendOrderMessage(orderId, text)),
  });

  return (
    <div className="text-start">
      <div className="mb-3">
        <h3 className="text-lg font-serif text-white">
          {title || (isAr ? 'محادثة الطلب' : 'Order Conversation')}
        </h3>
        <p className="text-xs text-gray-400">
          {isAr ? 'تواصل مع الطرف الآخر بخصوص هذا الطلب' : 'Message the other party about this order'}
        </p>
      </div>
      <ChatThread
        messages={messages}
        currentUserId={me}
        connected={connected}
        sending={sending}
        error={error}
        onSend={send}
        language={language}
        emptyNote={isAr ? 'ابدأ المحادثة حول هذا الطلب.' : 'Start the conversation about this order.'}
      />
    </div>
  );
};

export default OrderChat;
