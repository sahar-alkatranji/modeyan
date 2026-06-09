HIGH EFFORT - Complete Modeya Marketplace Fixes

You are working in /root/modey/modeyan (frontend) and /root/modey/modeya_backend (backend).
Backend runs on port 8002 via systemd (modeya-backend).
Frontend runs on port 3000 via systemd (modeya-frontend).

## TASK 1: Wire OrderChat into Order Views
The OrderChat component exists (components/dashboard/OrderChat.tsx) but is NOT wired into any view.
- Add OrderChat to AdminOrders.tsx — when admin clicks an order, show OrderChat below the order details
- Add OrderChat to the user's order list view — when user clicks an order, show OrderChat
- The OrderChat needs orderId prop: <OrderChat orderId={selectedOrderId} />

## TASK 2: Fix WebSocket for Chat
The chat components use WebSocket but Vite proxy doesn't support WS yet.
- Add ws: true to the /api proxy in vite.config.ts
- Add a /ws proxy entry in vite.config.ts pointing to localhost:8002
- Verify the backend has WebSocket endpoints for order chat and support chat

## TASK 3: Fix Backend 500 on GET /designs/{id} with reviews
The backend returns 500 when a design has reviews. Find and fix the bug in the backend.
- Check the reviews endpoint in the backend
- Fix any serialization or query issues
- Test: curl http://localhost:8002/api/v1/designs/1 should return 200

## TASK 4: End-to-End Verification
After all fixes:
1. Run tsc --noEmit — must be 0 errors
2. Test all key endpoints with curl:
   - GET /api/v1/categories
   - GET /api/v1/shipping-policies
   - GET /api/v1/admin/settings (with auth)
   - GET /api/v1/designs (list)
3. Git commit + push all changes

## IMPORTANT RULES
- You CAN modify the backend (port 8002) for bug fixes
- Restart backend after changes: sudo systemctl restart modeya-backend
- Restart frontend after vite.config changes: sudo systemctl restart modeya-frontend
- Git commits: git add -A && git commit -m "message" && git push origin main
- Always run tsc --noEmit before committing frontend changes
- If .git/objects has permission issues: sudo chown -R claude_user:claude_user /root/modey/modeyan/.git/objects/
