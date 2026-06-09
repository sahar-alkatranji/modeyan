Task 5: Order Chat + Support Chat

Files to create:
1. components/dashboard/OrderChat.tsx — Chat between customer and tailor on an order
2. components/dashboard/SupportChat.tsx — Customer support chat with admin

Backend endpoints (already exist):
- Order chat: GET/POST /orders/{order_id}/messages
- Support chat: GET/POST /support/tickets, GET/POST /support/tickets/{id}/messages

API methods to add to services/api.ts:
- getOrderMessages(orderId: number): GET /orders/{orderId}/messages
- sendOrderMessage(orderId: number, data: {content: string}): POST /orders/{orderId}/messages
- getSupportTickets(): GET /support/tickets
- createSupportTicket(data: {subject: string, message: string}): POST /support/tickets
- getTicketMessages(ticketId: number): GET /support/tickets/{ticketId}/messages
- sendTicketMessage(ticketId: number, data: {content: string}): POST /support/tickets/{ticketId}/messages

Requirements:
- Both components should be standalone, no WebSocket needed (polling every 5s is fine)
- OrderChat: accessible from order detail view (OrderDetailModal or admin-orders)
- SupportChat: accessible from user dashboard sidebar
- Bilingual (ar/en) with translations
- Clean UI matching the existing dashboard style (dark glass theme)
- Wire into UserDashboard sidebar and views
- Run tsc --noEmit after to verify 0 errors
- Git commit + push when done

IMPORTANT: You are in /root/modey/modeyan. Do NOT touch the backend. All work is frontend only.
