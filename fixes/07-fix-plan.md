# 07 — Step-by-Step Fix Plan (exact patches)

**Date:** 2026-06-09. Each item: **location** (`file:line`), **problem**, **exact fix** (old → new), and an **applicability tag**:

- `[FE ✅ APPLIED]` — frontend, already changed in this session.
- `[FE ⏳ READY]` — frontend, safe to apply (writable); not yet applied (needs care / larger build).
- `[BE 🔒 BLOCKED]` — backend, **cannot be written by claude_user** (`/root/modey/modeya_backend` is `root:root`). Apply as root, or run the unblock step below.

### Unblock the backend (one of these)
```bash
# Option A — give the agent write access (run as a root-capable user):
sudo chown -R claude_user:claude_user /root/modey/modeya_backend
# Option B — apply the patches in this file yourself as root, then:
cd /root/modey/modeya_backend && git add -A && git commit -m 'fix: audit fixes - auth, escrow, payments, migrations'
```
Backend currently runs as **root on :8002**; restart it after edits (e.g. `uvicorn app.main:app --port 8002 --reload`, however it is supervised).

---

## P0

### P0-1 — `POST /wallet/top-up` mints free balance  `[BE 🔒 BLOCKED]` + `[FE ⏳ READY]`
**Backend** `app/routers/auth.py:195-214` — endpoint credits balance instantly with `status=completed`, no payment. An admin-gated manual-credit path already exists (`PUT /admin/users/{id}/wallet`), and the user self-service path already exists (`POST /wallet/payment-topup` → admin approval). So **delete the insecure route**:
```python
# DELETE this entire block (auth.py:195-214)
@router.post("/wallet/top-up", response_model=WalletResponse)
def top_up_wallet(data: WalletTopUp, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ...
    return current_user
```
**Frontend** `services/api.ts:185-190` — remove `topUpWallet`, and rewire the wallet button (`components/UserDashboard.tsx:433`) to the secure pending flow:
```ts
// UserDashboard.tsx:433 — replace api.topUpWallet(...) with:
await api.paymentTopup(parseFloat(topUpAmount), selectedPaymentMethodId, receiptUrl);
alert(t('wallet_topup_pending'));   // "Your top-up is pending admin approval"
```
This requires a payment-method selector + (for `wallet_qr`) a receipt upload, plus the admin approval panel in P0-4. Until the backend route is deleted, the endpoint stays directly exploitable even after the UI stops calling it.

### P0-2 — No real payments; Stripe is dead/simulated  `[FE ⏳ READY]` (manual model) / `[BE 🔒]` (only if going real-gateway)
**Decision:** the seed data is SYP + local methods (Sham Cash, Syriatel/MTN Cash, bank transfer) → **manual receipt + admin approval is the realistic model**, which already exists server-side. Action:
- Delete dead `components/dashboard/StripePaymentForm.tsx` and the unused `<script src="https://js.stripe.com/v3/">` in `index.html:12`. `[FE ⏳]`
- Remove `@stripe/*` from `package.json` deps. `[FE ⏳]`
- Build the receipt-upload + admin-approval UI (P0-4). `[FE ⏳]`
- *If* a real card gateway is later required, that is a backend project (PaymentIntent + webhook) — out of scope for manual model.

### P0-3 — Quote subsystem has no frontend  `[FE ⏳ READY]`
**`services/api.ts`** has no quote methods. Add:
```ts
async submitQuote(d:{order_id:number;price:number;estimated_days?:number;message?:string}){return this.request('/quotes',{method:'POST',body:JSON.stringify(d)});}
async getOrderQuotes(orderId:number){return this.request<any[]>(`/orders/${orderId}/quotes`);}
async respondToQuote(quoteId:number, accept:boolean){return this.request(`/quotes/${quoteId}/respond`,{method:'PUT',body:JSON.stringify({accept})});}
```
Then add UI: tailor "Submit quote" on pending orders; customer "View/Accept/Reject quotes" in order detail. (Backend routes already exist: `orders.py:200,304,237`.)

### P0-4 — Secure top-up + admin approval unwired  `[FE ⏳ READY]`
`api.paymentTopup / getPendingTopups / approveTopup` exist (`api.ts:192,199,203`) but are called nowhere. Build:
- Customer: top-up modal → choose method → (if `wallet_qr`) `uploadFile(receipt)` → `paymentTopup(amount, methodId, receiptUrl)`.
- Admin: "Pending Top-ups" panel → `getPendingTopups()` list → Approve/Reject → `approveTopup(id, approve, note)`.
All hit the already-running backend on :8002 — fully testable via curl now.

---

## P1

### P1-5 — `PUT /orders/{id}/status` missing ownership check  `[BE 🔒 BLOCKED]`
**`app/routers/orders.py:135-138`** — after fetching `order`, insert:
```python
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    # FIX: authorize — only the customer, the assigned tailor, or a manager
    is_owner = current_user.id == order.customer_id
    is_assigned_tailor = order.tailor_id is not None and current_user.id == order.tailor_id
    if current_user.role != UserRole.manager and not (is_owner or is_assigned_tailor):
        raise HTTPException(status_code=403, detail="Not authorized to modify this order")
    new_status = data.status
```

### P1-6 — `PUT /quotes/{id}/respond` non-idempotent double-charge  `[BE 🔒 BLOCKED]`
**`app/routers/orders.py:247-250`** — after the `order.customer_id` auth check, before `if data.accept:`:
```python
    if quote.is_accepted or quote.is_rejected:
        raise HTTPException(status_code=400, detail="This quote has already been responded to")
    if order.status != OrderStatus.quote_submitted:
        raise HTTPException(status_code=400, detail=f"Order is not awaiting a quote response (status: {order.status.value})")
```

### P1-7 — Escrow auto-release scheduler  `[BE 🔒 BLOCKED]`
**`app/main.py`** — run `release_pending_balances` on a loop (today it only fires lazily inside `GET /orders/{id}`):
```python
import asyncio, logging
from .core.database import SessionLocal
from .services.escrow import release_pending_balances

async def _escrow_release_loop():
    while True:
        try:
            db = SessionLocal()
            try: release_pending_balances(db)
            finally: db.close()
        except Exception:
            logging.exception("escrow release loop failed")
        await asyncio.sleep(3600)  # hourly

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    task = asyncio.create_task(_escrow_release_loop())
    try:
        yield
    finally:
        task.cancel()
```

### P1-8 — bcrypt token fingerprint entropy (~6 bits → 64 bits)  `[BE 🔒 BLOCKED]`
**`app/core/security.py`** add (no schema change):
```python
import hashlib
def password_fingerprint(password_hash: str) -> str:
    return hashlib.sha256((password_hash + settings.SECRET_KEY).encode("utf-8")).hexdigest()[:16]
```
**`app/routers/auth.py:19-22`** `_make_token`: `pwh = password_fingerprint(user.password_hash)`.
**`app/core/deps.py:52-61`**: `current_pwh = password_fingerprint(user.password_hash)` and compare full 16 chars. Deterministic from the full hash (which fully changes on password change) → reliable invalidation.

### P1-9 — Gemini key client-side → backend  `[FE ⏳ READY]` + `[BE ⚠ needs .env key — 🔒]`
Backend `POST /ai/generate-image` already exists and keeps the key server-side, **but** `.env` has no `GEMINI_API_KEY` (and `.env` is not writable by me). Plan:
1. Set `GEMINI_API_KEY=...` in `modeya_backend/.env` (root). `[🔒]`
2. Frontend: add `api.generateAiImage(prompt, parts)` → `POST /ai/generate-image`; in `DesignStudio.tsx:39-102` replace the `GoogleGenAI` client path with that call and parse `candidates[0].content.parts[].inlineData.data`. `[FE ⏳]`
3. Remove `@google/genai` from `package.json`. `[FE ⏳]`
> Hold the `DesignStudio` swap until step 1 is done, otherwise AI generation 503s.

### P1-10 — `deleteDesignAsset` int/string id mismatch  `[FE ⏳ READY]`
`AdminDesignAssets.tsx:81` → `api.deleteDesignAsset(id)` → `DELETE /parts/{id}` (int), but disk-scanned assets have string ids (`front_neckline_VNeck`). Fix UI to only offer delete for numeric DB-backed parts, or add a backend disk-asset delete route `[BE 🔒]`.

### P1-11 — Order detail never fetched  `[FE ⏳ READY]`
Wire `api.getOrderDetail(orderId)` when opening an order so `design`/`measurements`/`quotes` populate (today `App.tsx:163` stubs them `{}`).

### P1-12 — Missing UI: change-password, order-cancel, transactions, reviews  `[FE ⏳ READY]`
Wire existing api methods: `changePassword` (profile), `cancelOrder` (order row), `getTransactions` (wallet ledger), and add design-review create/read.

---

## P2

### P2-13 — Product reviews are stubs  `[BE 🔒 BLOCKED]`
`app/routers/catalogs.py:213-251` returns/echoes without persisting. Needs a `PortfolioReview` model + migration + real queries. (Code sketch in `08`/follow-up.)

### P2-14 — Migrations via `create_all`, not Alembic  `[BE 🔒 BLOCKED]`
`app/main.py:26`. Baseline + switch:
```bash
cd /root/modey/modeya_backend
alembic revision --autogenerate -m "baseline schema"
alembic upgrade head
# then remove Base.metadata.create_all(bind=engine) from lifespan; run `alembic upgrade head` on deploy
```

### P2-15 — Misc `[FE ⏳]`/`[BE 🔒]`
- `[FE ✅ APPLIED]` Remove `manager` from signup roles (`LoginPage.tsx:177`).
- `[FE ⏳]` Tailwind via CDN (`index.html:8`) → build-time Tailwind/PostCSS.
- `[FE ⏳]` Call `refreshUser()` after wallet/quote/order money ops (stale balance).
- `[BE 🔒]` `create_design` accepts any role (`catalogs.py:90`) — restrict to designer/manager.
- `[BE 🔒]` WS `sub` str/int + no `pwh`/`is_active` recheck (`chat.py:47`, `support_chat.py:331`).
- `[BE 🔒]` `/upload` reads whole file before size check; leaks exception text (`file_upload.py:35`, `upload.py:23`).
- `[BE 🔒]` Add rate limiting (slowapi) on `/auth/login`, `/auth/register`, `/upload`, `/ai/*`.
- `[FE ⏳]` Dev proxy `:8002` vs `run.py :8000` — backend actually serves on **:8002** (verified), so align `run.py`/docs to 8002.

### P2-16 — Newly found via `tsc` (2026-06-09)  `[FE ⏳ READY]`
- **`components/ErrorBoundary.tsx`** — class is not generically typed: `Property 'state'/'props'/'setState' does not exist on type 'ErrorBoundary'` (lines 28,29,52,69,85,87,94) + `import.meta.env` typing. Fix: `class ErrorBoundary extends React.Component<Props, State>` with proper interfaces, and add `vite/client` to tsconfig `types` for `import.meta.env`. The error boundary currently does not type-check (and may not behave as intended).
- **`translations/ar.ts` & `translations/en.ts`** — duplicate object keys (TS1117) at lines 605–612. JS keeps the **last** occurrence, so earlier translations are silently dead. Fix: remove the earlier duplicate entries (keep the last to preserve current rendered behavior).

---

## Application order (when unblocked)
1. **BE:** P0-1 delete route · P1-5/6 authz/idempotency · P1-8 fingerprint · P1-7 scheduler · P2-14 alembic · P1-9 set key.
2. **FE:** P0-3/4 quote + secure top-up + admin approval · P0-2 remove Stripe · P1-9 AI swap · P1-10/11/12 wiring · P2-15.
3. **Verify:** curl CRUD against :8002, `npx tsc --noEmit`, `npm run build`, then commit both repos.
