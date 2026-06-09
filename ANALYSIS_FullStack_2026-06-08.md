# MODEYA — Comprehensive Full-Stack Analysis

**Date:** 2026-06-08
**Scope:** `/root/modey/modeyan` (React/TS frontend) + `/root/modey/modeya_backend` (FastAPI backend)
**Type:** Read-only analysis. **No code was modified.** This document records the *current* state of the codebase, reconciles it against the prior `plans/` and `*Report*` docs (many of whose findings are already fixed), and surfaces issues those docs do not cover.

> **Note on task input:** The driving instruction ended at "Here is what you must do:" with no list. I proceeded on the stated directive — *comprehensive analysis only, write documentation, change nothing*. If a narrower focus was intended, point me at it.

---

## Severity legend

| Mark | Meaning |
|------|---------|
| 🔴 P0 | Exploitable / money-losing / data-exposing. Fix before any real launch. |
| 🟠 P1 | Correctness or security weakness; real impact under normal use. |
| 🟡 P2 | Robustness, portability, maintainability, or ops gap. |
| 🟢 P3 | Minor / future hardening. |
| ✅ | Verified already implemented / fixed. |

---

## 1. Executive summary

MODEYA is a bilingual (Arabic/English, RTL-aware) fashion-boutique marketplace. Customers browse designs, customize a dress in a "Design Studio" (with AI image generation), and order; **tailors** quote and fulfill; **designers** publish designs; a **manager** administers; **support agents** run live chat. Money flows through an in-app **wallet + escrow** model (tailor/designer/platform revenue split, 15-day pending release).

The codebase is well past a prototype: the backend has a coherent domain model, role-based dependencies, row-level locking on balance mutations, an order state machine, pagination, and WebSocket chat. A prior review cycle (visible as `# S1`, `# B1`, `# B6`, `# B7` markers in code) already closed many issues catalogued in `plans/`.

**However, the payment/wallet subsystem is not safe for production, and several authorization gaps remain.** The three findings that matter most are not covered by the existing `plans/` docs:

1. **🔴 Free money.** `POST /wallet/top-up` credits the caller's balance instantly with `status=completed` and **no payment of any kind**. The live wallet UI button calls exactly this endpoint. Any logged-in user can mint unlimited balance.
2. **🔴 No real payments exist.** The backend has **zero** Stripe/payment-gateway code. The frontend `StripePaymentForm` tokenizes a card and then calls `onSuccess()` on a `setTimeout` — and is itself **dead code** (never imported or mounted). "Payment" is entirely simulated.
3. **🟠 Order status is editable by anyone.** `PUT /orders/{id}/status` enforces the *state machine* but not *ownership*: any authenticated user can drive any order through its transitions.

A launch-readiness path is in §9.

---

## 2. Architecture overview

### 2.1 Frontend (`modeyan/`)
- **Stack:** React 19, TypeScript ~5.8, Vite 6. Tailwind via **CDN `<script>`** in `index.html` (not a build dependency). ~7,200 LOC of components.
- **Routing:** Hand-rolled, via `window.history.pushState` + a `currentPage` state union in `App.tsx`. No router library. Deep links rely on a server SPA-fallback in production.
- **State:** Local component state + **prop-drilling**. `App.tsx` owns `products/users/orders/dressParts/socialLinks/savedDesigns` and passes ~15 props into `UserDashboard`. `cart`, `savedDesigns`, JWT, and cached user persist in `localStorage`. No global store.
- **Auth:** `services/api.ts` `ApiClient` holds a Bearer token in `localStorage` (`modeya_token`), auto-clears on 401, 15s default fetch timeout (120s for uploads). `AuthContext` restores session via `/auth/me`.
- **Data strategy:** API-first with **bundled constant fallbacks** (`constants.tsx` `PRODUCTS`, `DRESS_PARTS`) so the UI renders even when the backend is down — resilient, but a source of stale/duplicate data.
- **AI:** `DesignStudio.tsx` calls Google Gemini **directly from the browser** via `@google/genai`.
- **i18n:** `LanguageContext` + `translations/{ar,en}.ts`, `useTranslation` hook.

### 2.2 Backend (`modeya_backend/`)
- **Stack:** FastAPI, SQLAlchemy 2.x, Pydantic v2, SQLite (`fashion_db.sqlite3`), Alembic present, JWT via `python-jose`, `bcrypt` directly, `httpx` for Gemini. `requirements.txt` also lists `pymysql` (MySQL intended for prod, but `DATABASE_URL` defaults to SQLite).
- **Entrypoint:** `app/main.py` — mounts 12 routers, static `/storage/uploads`, custom image-serving routes; `run.py` runs uvicorn on **:8000** with `reload=True`.
- **Schema management:** `Base.metadata.create_all()` at startup (`main.py:26`). Alembic exists but has **one** migration (`add_ornaments_category`). → schema is effectively code-defined; drift is untracked (see §6).
- **Routers:** auth, catalogs, orders, transactions, chat (WS), support_chat (WS), portfolio, admin, upload, ai, categories, shipping.
- **Services:** `escrow`, `file_upload`, `gemini`, `asset_scanner` (serves dress-part images from `images/<category>/`).

### 2.3 Domain model (`app/models/models.py`)
`User` (6 roles: manager, customer, designer, tailor, exchange_center, support_agent) · `DressPart` · `Design` · `Quote` · `Order` (7-state status enum) · `Measurement` · `Transaction` (8 types) · `ChatMessage` · `Review` · `SupportChat`/`SupportMessage` · `PortfolioItem` · `PaymentMethod` · `SocialLink` · `SiteSettings` · `Category` · `ShippingPolicy`. Balances are `DECIMAL(12,2)`; `balance` + `pending_balance` per user.

### 2.4 Wallet / escrow flow (as implemented)
```
TOP-UP
  A) POST /wallet/top-up            -> balance += amount, status=completed   [INSTANT, NO PAYMENT]  <- UI uses this
  B) POST /wallet/payment-topup     -> Transaction(pending) -> admin PUT /wallet/approve-topup/{id} -> balance += amount

ORDER + ESCROW
  POST /orders (customer)           -> status=pending_quote
  POST /quotes (tailor)             -> status=quote_submitted
  PUT  /quotes/{id}/respond accept  -> balance -= price (locked); designer paid immediately (ready designs);
                                       shares computed; other quotes rejected; status=quote_accepted
  PUT  /orders/{id}/status          -> ... in_progress ... completed (tailor/manager)
       on completed:                   escrow_release_date = now+15d; tailor.pending_balance += tailor_share; escrow_hold txn
  RELEASE                           -> lazy, only inside GET /orders/{id} when now >= release_date (idempotent)
                                       escrow.release_pending_balances() exists but is NEVER scheduled/called
```
Revenue split (`core/config.py`): ready-design → tailor 80% / designer 10% / platform 10%; AI-design → tailor 80% / platform 20%.

---

## 3. 🔴 Critical findings (not in prior docs)

### C1 — `POST /wallet/top-up` mints balance with no payment 🔴
**`app/routers/auth.py:195-214`**, used by **`components/UserDashboard.tsx:433`** (`api.topUpWallet`, `services/api.ts:185`).
```python
current_user.balance = current_user.balance + Decimal(str(data.amount))
transaction = Transaction(..., transaction_type=top_up, status=TransactionStatus.completed, description="Wallet top-up")
```
Any authenticated user credits themselves arbitrary funds (`WalletTopUp` only enforces `amount > 0`). The wallet UI's primary "Top up" button calls it directly. A correct, admin-gated flow already exists (`payment-topup` → `approve-topup`), which makes this endpoint a leftover that **bypasses the entire payment + approval system**. Those funds can then pay real tailors/designers and become withdrawable balance.
**Impact:** unlimited free credit → direct financial loss across the marketplace.
**Direction:** remove `/wallet/top-up` (and `api.topUpWallet`); route all top-ups through `payment-topup` + admin approval (or a real gateway). *Not applied — analysis only.*

### C2 — No real payment processing; Stripe is simulated and unmounted 🔴
- Backend: **no Stripe dependency or code** anywhere (`grep stripe app/` → only `stripe_public_key` passthrough in `admin.py`). No PaymentIntent, no charge, no webhook.
- Frontend: `components/dashboard/StripePaymentForm.tsx` does `stripe.createToken(...)` then `setTimeout(() => onSuccess(), 1000)` — it never sends the token anywhere. Worse, it is **dead code**: no file imports it, there is no `loadStripe`/`<Elements>` provider; `js.stripe.com` is loaded in `index.html` but unused.
- `payment-topup` ignores gateway specifics: every method just creates a `pending` row for manual admin approval (matches prior **B9**).
**Impact:** there is no path by which money actually enters the system; all "payments" are trust-based manual approvals or the C1 free-credit path.
**Direction:** implement a real gateway (server-side PaymentIntent + webhook that credits balance) or make the manual-receipt model explicit and remove Stripe scaffolding.

### C3 — `PUT /orders/{id}/status`: state machine without authorization 🟠→🔴 in marketplace context
**`app/routers/orders.py:128-174`.** The endpoint validates `ALLOWED_TRANSITIONS` (good, prior **B2**) but only the `completed` branch checks role (`tailor|manager`) — and **even that does not verify the caller is the order's assigned tailor**. All other transitions require only `get_current_user`. Consequences:
- Any customer can transition **another** customer's order (`quote_accepted → in_progress`, `in_progress → disputed`, `completed → disputed`, …).
- Any tailor (not the assigned one) can mark any `in_progress` order `completed`, prematurely starting the assigned tailor's 15-day escrow and writing an `escrow_hold` txn.
**Impact:** broken access control / IDOR over the entire order lifecycle.
**Direction:** enforce ownership — customer⇒own order, tailor⇒assigned order, manager⇒any — for every transition, not just `completed`.

### C4 — `PUT /quotes/{id}/respond` is not idempotent → double-charge 🟠
**`app/routers/orders.py:237-301`.** No guard that the quote/order isn't already accepted/paid. Re-POSTing `{"accept": true}` re-runs balance deduction **and** re-pays the designer (`designer.balance += designer_share`) each time. A double-click or replay double-charges the customer and double-pays the designer.
**Direction:** reject if `quote.is_accepted` or `order.status != quote_submitted`; make the balance move idempotent per order.

---

## 4. 🟠 Security findings

### S-A — `pwh` token-invalidation fingerprint is ~6 bits 🟠
**`auth.py:19-22`, `deps.py:51-61`.** Tokens embed `password_hash[:8]` to invalidate sessions on password change. Verified: a bcrypt hash is `$2b$12$` + salt; the first 8 chars are the constant `$2b$12$` **plus one salt char**. So the fingerprint carries ~6 bits of entropy. Invalidation is therefore *probabilistic*: ~1/64 of password changes leave old tokens valid (new salt's first char collides). It mostly works, but it is not a robust revocation mechanism.
**Direction:** use a real `token_version`/`jti` column bumped on password change (the original **B6** recommendation), or compare a full HMAC of the hash.

### S-B — WebSocket auth: `sub` type bug + no `pwh`/active check 🟠
**`chat.py:47`, `support_chat.py:331`:** `user_id: int = payload.get("sub")` — but `sub` is now a **string** (B7), so the annotation lies and `User.id == user_id` compares int↔str (works in SQLite via coercion, fragile elsewhere). Neither WS path re-checks the `pwh` fingerprint or `is_active`, so a password change / deactivation does not drop live or newly-opened sockets. (Prior **B19** flagged support_chat as unreviewed — now reviewed.)

### S-C — Image-serving routes lack path-containment 🟡
**`main.py:69-94`, `asset_scanner.py:70-77`.** `serve_dress_image` / `serve_uploaded_file` / `serve_payment_image` build `dir / filename` from the URL and check `.exists()/.is_file()` but never `.resolve()`-and-verify the result stays under the base dir. FastAPI path segments can't contain `/`, which blocks the classic `../../` case, but there's no defense-in-depth against encoded/edge traversal. Add a `resolve().is_relative_to(base)` check.

### S-D — `POST /upload` leaks exception text 🟡
**`upload.py:23-24`:** `detail=f"Upload failed: {str(e)}"` returns internal error text to clients — contradicts the S4 hardening applied to `/auth/login`. Return a generic message; log details server-side.

### S-E — File read into memory *before* size check (DoS) 🟡 (prior **B15**, still open)
**`file_upload.py:35-37`:** `contents = file.file.read()` loads the whole upload (limit 100 MB) into RAM, then checks size. A larger body OOMs before rejection. Stream in chunks with a running total. Also: extension is still derived from `mime` only after a client-supplied `content_type` check — no content sniffing, no per-user quota (prior **B14**).

### S-F — No rate limiting anywhere 🟠 (prior **S7/B13**, still open)
`/auth/login` (brute force), `/auth/register` (spam), `/upload`, and the AI route have no throttling. `slowapi` or gateway-level limits needed.

### S-G — Seed ships well-known credentials 🟡
**`seed.py:15`:** every demo account (including `admin@modeya.com`, role *manager*) uses `Modeya@2026`, printed to stdout. If `seed.py` runs against production, the platform ships with a known admin password. Gate seeding to non-prod, or force a password reset on first admin login.

### S-H — Frontend Gemini key exposure design 🟠 (extends prior **S18**)
**`DesignStudio.tsx:49-62`.** The browser obtains the Gemini key from `getPublicSettings().gemini_api_key` (today the backend correctly withholds it — `admin.py:24-37`) and falls back to `localStorage('modeya_gemini_key')`, then calls Gemini **client-side**. The very shape of this code *expects the key in public settings*; the day an admin saves it `is_secret=False`, it leaks to every visitor. Meanwhile a **secure server-side `/api/v1/ai/generate-image` exists and is unused** (`ai.py` + `gemini.py`). Model strings also diverge (frontend `gemini-2.5-flash-image` vs backend `gemini-2.0-flash-exp`).
**Direction:** route all AI through the backend endpoint; never expose the key to the client.

### S-I — `dangerouslySetInnerHTML` with translation content 🟢
**`ShippingPolicyPage.tsx:51`** renders `t('policy_preparation_desc')` as HTML. Content is developer-controlled today (static translation files) → low risk, but becomes XSS if translations/site-settings ever become user/admin-editable. Sanitize or avoid.

### Standing items (correctly noted by prior docs, still applicable)
- **JWT lifetime 7 days, no refresh token** (S5), token in `localStorage` → XSS can exfiltrate (S14). No CSP/security headers from the app (S15) — must be added at the reverse proxy; note CDN Tailwind + Stripe.js + Gemini calls widen any CSP. No email verification (S9). No audit logging of security/financial events (S17).

---

## 5. 🟠 Business-logic & backend correctness

| ID | Location | Issue | Sev |
|----|----------|-------|-----|
| BL-1 | `escrow.py` + `services/__init__.py` | `release_pending_balances()` is never scheduled. Release happens **only** lazily inside `GET /orders/{id}`. Orders nobody re-opens never move `pending_balance → balance`. (prior **B8**, partially mitigated.) | 🟠 |
| BL-2 | `orders.py:86`, `orders.py:153`, `escrow.py:8` | `datetime.utcnow()` (naive) compared to / stored in `DateTime(timezone=True)` columns. Works on SQLite (returns naive), can raise `TypeError`/compare wrong on Postgres/MySQL. Also deprecated in 3.12 (prior **B20**). Use `datetime.now(timezone.utc)`. | 🟡 |
| BL-3 | `orders.py:256-289` | On `ready` design acceptance the **designer is paid immediately** while the tailor's share is escrowed until completion. Inconsistent escrow treatment; no `designer_payout` Transaction is recorded (no audit trail; prior **B21**). | 🟠 |
| BL-4 | `orders.py:177-197` | `assign_tailor` resets status to `pending_quote` from any state, bypassing `ALLOWED_TRANSITIONS`. | 🟡 |
| BL-5 | `catalogs.py:213-251` | `GET/POST /products/{id}/reviews` are **stubs** — they validate input but persist nothing (`return []` / echo). The product-review feature silently no-ops (prior **NB-12**). | 🟠 |
| BL-6 | `catalogs.py:90-100` | `create_design` requires only `get_current_user`; any role can create a `Design` and become its `designer_id`. Likely unintended for customers. | 🟡 |
| BL-7 | `transactions.py:296` (support REST) & comments | `send_support_message`'s "keep active when customer sends" comment contradicts its `role in (manager, support_agent)` condition; waiting→active transition only fires for agents, not customers. | 🟢 |
| BL-8 | `admin.py:47-49` | `total_revenue` filters `Order.status != "cancelled"` (string vs Enum). Works in SQLite; verify under other backends. | 🟢 |

**Verified-good:** balance mutations use `SELECT ... FOR UPDATE` + `Decimal` (B1 ✅); order transitions gated by `ALLOWED_TRANSITIONS` (B2 ✅, but see C3 for authz); quotes only accepted in `pending_quote` (B4 ✅); manager-only `assign_tailor` (B3 ✅); manager/support chat access (B10 ✅); list pagination (B12 ✅); admin user create returns `UserResponse`, not a token (B16 ✅).

---

## 6. 🟡 Data / database / migrations
- **Schema via `create_all` (B17, open):** `main.py:26` builds tables from models at boot; Alembic has a single migration. Any future column change won't be migrated — risk of "works on my DB, missing column in prod." Pick one strategy (Alembic-as-source-of-truth) before data matters.
- **SQLite in default config (S13):** fine for dev; concurrency/locking and the `DECIMAL`/timezone behaviors above argue for Postgres in prod. `pymysql` in `requirements.txt` hints at an intended MySQL target that isn't wired to `DATABASE_URL`.
- **`Decimal ⇄ float` at the edges:** response schemas expose `balance: float` (`schemas/user.py`); aggregates use `float(...)`. Acceptable for display, but keep all *arithmetic* in `Decimal` (already done in the hot paths).

---

## 7. 🟡 Frontend & integration
- **I-A — Dev proxy/port mismatch:** `vite.config.ts` proxies `/api` and `/storage` to **`localhost:8002`**, but `run.py` serves uvicorn on **:8000** and `Agent.md` documents :8000. Whichever is canonical, the two disagree — verify the actual dev launch command (`uvicorn app.main:app --port 8002`?).
- **I-B — Tailwind via CDN in `index.html`:** the play-CDN is explicitly not for production (no purge, runtime compile, blocks a strict CSP). Move to a build-time Tailwind/PostCSS pipeline.
- **I-C — Registration still offers `manager`:** `LoginPage.tsx:177` lists `['customer','designer','tailor','manager']`; the backend now rejects non-public roles (S1 ✅ server-side), so choosing "manager" yields a 422. Remove it from the UI (the S1 frontend half is unfinished).
- **I-D — `as any` order/data mapping (I3):** `App.tsx:163-176` maps orders with `design: {} as any`, `measurements: {} as any`; detail must be fetched via `getOrderDetail`. Broad `any` usage across the API layer erodes the TS safety net.
- **I-E — Balance not refreshed after money ops (I6/I12):** wallet/quote actions don't consistently `refreshUser()`, so `pending_balance`/`balance` can look stale until reload.
- **I-F — Order chat WS unused on the client (I7):** backend exposes `/ws/chat/{order_id}` and `/ws/support/{chat_id}`, but `services/api.ts` has no WS connector; order chat is effectively unwired in the UI.
- **No automated tests** in either project (only `test_*.json` request fixtures in the backend). `plans/09_Test_Plan.md` is a plan, not tests.

---

## 8. ✅ What's done well (so the report is balanced)
- Required `SECRET_KEY` with no default; `.env` is git-ignored and holds only `SECRET_KEY`/`DATABASE_URL` (S2 ✅).
- Self-registration role validator blocks privilege escalation server-side (S1 ✅).
- `GET /users/{id}` requires auth and returns `PublicUserResponse` to non-owners (S3/B11 ✅).
- `/auth/login` no longer leaks stack traces (S4 ✅).
- Concurrency-safe balance mutations (row locks + `Decimal`) and an explicit order state machine.
- Clean role-dependency layering in `core/deps.py`; consistent router structure; sensible DB indexes on hot query columns.
- Thoughtful frontend resilience (API-with-fallback), `ErrorBoundary`, RTL/i18n support, request timeouts, 401 auto-logout.
- A genuinely useful prior paper trail in `plans/01–10` and `QA-REPORT.md`.

---

## 9. Prioritized recommendations (documentation only — nothing applied)

**P0 — before any real launch**
1. Remove/disable `POST /wallet/top-up` and `api.topUpWallet`; force all credit through `payment-topup` + admin approval or a real gateway (C1).
2. Decide the payment model: implement a server-side gateway (PaymentIntent + webhook that credits balance) **or** formally adopt manual-receipt approval and delete the Stripe scaffolding/`StripePaymentForm` (C2).
3. Add ownership checks to every `/orders/{id}/status` transition (C3); make `/quotes/{id}/respond` idempotent (C4).
4. Don't seed production with `Modeya@2026`; rotate/disable demo accounts (S-G).

**P1**
5. Replace the `pwh` fingerprint with a `token_version`/`jti` (S-A); add `pwh`+`is_active` checks and fix the `sub` type on both WS endpoints (S-B).
6. Route AI through the existing backend `/ai/generate-image`; stop reading the Gemini key in the browser (S-H).
7. Add rate limiting on auth/upload/AI (S-F); stream-and-cap uploads, generic upload errors (S-D/S-E).
8. Schedule escrow release (cron/APScheduler) instead of lazy-only (BL-1); record `designer_payout`/`escrow` audit transactions (BL-3).
9. Implement or remove the product-review stubs (BL-5).

**P2**
10. Commit to Alembic; drop `create_all` for prod; plan SQLite→Postgres (B17/S13).
11. Normalize `datetime.now(timezone.utc)` everywhere (BL-2).
12. Reconcile the 8000/8002 proxy mismatch (I-A); move Tailwind to a build step (I-B); remove "manager" from signup (I-C).
13. Add security headers/CSP at the reverse proxy (S15); add audit logging (S17); add a test suite.

---

## 10. Endpoint inventory (reference)

| Area | Key endpoints |
|------|----------------|
| Auth/Users | `POST /auth/register`·`/auth/login`, `GET/PUT /auth/me`, `PUT /auth/change-password`, `GET /users[/{id}]`, `POST/PUT/DELETE /users`, `GET /wallet`, **`POST /wallet/top-up`** ⚠ |
| Catalog | `GET /parts[/category/{c}]`, `GET /parts/scanner/{c}`, `POST /parts`, `GET/POST/PUT/DELETE /designs`, `*/designs/{id}/reviews`, `*/products/{id}/reviews` (stub) |
| Orders/Quotes | `POST/GET /orders`, `GET /orders/{id}`, **`PUT /orders/{id}/status`** ⚠, `POST /orders/{id}/assign-tailor`, `POST /quotes`, **`PUT /quotes/{id}/respond`** ⚠, `*/measurements`, `DELETE /orders/{id}`, `GET /tailors/pending-orders` |
| Wallet/Tx | `POST /wallet/payment-topup`, `GET /wallet/pending-topups`, `PUT /wallet/approve-topup/{id}`, `GET /transactions` |
| Chat | `*/orders/{id}/messages`, WS `/ws/chat/{order_id}` |
| Support | `*/support/chats[...]`, `claim`, `messages`, WS `/ws/support/{chat_id}` |
| Portfolio | `POST/GET/DELETE /portfolio`, `/portfolio/pending`, `/portfolio/{id}/approve|reject` |
| Admin | `/admin/settings[/public]`, `/admin/stats`, `/admin/users/{id}/wallet`, `/admin/payment-methods`, `/admin/social-links`, `/admin/orders` |
| Catalog mgmt | `/categories` + `/admin/categories`, `/shipping-policies` + `/admin/shipping-policies` |
| AI/Upload/Media | `POST /ai/generate-image` (unused by UI), `POST /upload`, `GET /api/v1/images/...`, `/api/v1/uploads/...` |

⚠ = see §3 critical findings.

---

*Prepared by static review of the source on 2026-06-08. No files other than this report were created or changed. Line references are to the tree as read on that date.*
