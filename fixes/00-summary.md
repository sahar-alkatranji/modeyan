# 00 — Audit Summary (Executive)

**Date:** 2026-06-08 · **Method:** static code audit of `modeyan/` (frontend) + `modeya_backend/` (backend). **No source modified. No browser testing performed** (see "Scope notes"). All line numbers are as-read on 2026-06-08.

Companion detail: [`01-crud-status.md`](01-crud-status.md). Broader prior review: [`../ANALYSIS_FullStack_2026-06-08.md`](../ANALYSIS_FullStack_2026-06-08.md).

---

## TL;DR

The backend is substantially more complete than the frontend. The FastAPI service implements a full marketplace (auth, designs, orders, **quotes**, escrow wallet, **order chat**, **support chat**, portfolio, reviews, categories, shipping, admin). The React frontend wires up only a **subset** of it. The single most important audit finding is not a bug — it's **missing integration**: several *core* marketplace flows exist in the backend with **no frontend caller**.

On top of that, the one money flow that *is* wired is the **unsafe** one.

### What actually works (wired end-to-end, code-level)
- Auth: login / register / session restore (`/auth/login`, `/auth/register`, `/auth/me`).
- Browse designs on storefront (`GET /designs`) with bundled fallbacks.
- Design Studio part picker (disk scanner `GET /parts/scanner/{cat}`) + **client-side** AI image generation.
- Admin CRUD: Users, Products(=Designs), Payment Methods, Social Links; Portfolio approve/reject; Admin stats.
- Profile read/update + avatar upload (`/auth/me`, `/upload`).
- Wallet **balance read** + **instant top-up** (the unsafe one).

### What is broken / unsafe (wired but wrong)
- **P0** Instant free balance via `POST /wallet/top-up` — no payment (`auth.py:195`, UI `UserDashboard.tsx:433`).
- **P0** "Payments" are simulated — no backend gateway; `StripePaymentForm` is dead code.
- **P1** `PUT /orders/{id}/status` has no ownership check (`orders.py:128`).
- **P1** `PUT /quotes/{id}/respond` is non-idempotent → double-charge (`orders.py:237`).
- **P1** `deleteDesignAsset` sends a string scanner-id to an int-typed route → fails for disk-scanned parts.

### What is missing (backend exists, **zero** frontend wiring) — the big one
| Subsystem | Backend | Frontend | Effect |
|-----------|---------|----------|--------|
| **Quotes** (submit / list / accept-reject) | ✅ `orders.py:200,304,237` | ❌ no `api.ts` method at all | **The core tailor↔customer marketplace loop cannot be used from the UI.** |
| **Secure wallet top-up + admin approval** | ✅ `transactions.py:105,141,168` | ❌ `paymentTopup`/`getPendingTopups`/`approveTopup` defined but never called | Admins **cannot** approve top-ups; only the unsafe instant path works. |
| **Order chat** (REST + WS) | ✅ `transactions.py:44,74`, `chat.py:40` | ❌ no caller / no WS connector | Customers & tailors can't message per order. |
| **Support chat** (REST + WS) | ✅ entire `support_chat.py` | ❌ no `api.ts` methods | Live support feature is backend-only. |
| **Transactions history** | ✅ `GET /transactions` | ❌ `getTransactions` never called | No wallet/transaction ledger in UI. |
| **Order detail** (design, measurements, quotes) | ✅ `GET /orders/{id}` | ❌ `getOrderDetail` never called | Orders render with empty `design`/`measurements` (`App.tsx:163`). |
| **Order cancel** | ✅ `DELETE /orders/{id}` | ❌ `cancelOrder` never called | No way to cancel from UI. |
| **Change password** | ✅ `PUT /auth/change-password` | ❌ `changePassword` never called | No password-change UI. |
| **Design reviews** | ✅ `POST /designs/{id}/reviews` | ❌ no caller | Reviews can't be left. |
| **Product reviews** | ⚠ STUB (`catalogs.py:213,234` persists nothing) | ❌ no caller | Feature is a no-op even server-side. |
| **Categories / Shipping from API** | ✅ `categories.py`, `shipping.py` | ❌ FE uses hardcoded lists / translations | Admin-managed catalog taxonomy & shipping never reach the storefront. |
| **Admin site-settings editor** | ✅ `GET/PUT /admin/settings` | ❌ no caller | Can't edit settings (incl. keys) from UI. |

Full per-operation detail with file:line in [`01-crud-status.md`](01-crud-status.md).

---

## Severity-ranked findings

### P0 — blockers (money / core feature unusable)
1. **Free balance minting** — `POST /wallet/top-up` credits instantly, `status=completed`, no payment. `auth.py:195-214` ← `api.topUpWallet` `api.ts:185` ← `UserDashboard.tsx:433`.
2. **No real payment rail** — backend has no Stripe/gateway code; `StripePaymentForm.tsx` fakes success via `setTimeout` and is never mounted; `js.stripe.com` loaded but unused. Secure top-up exists server-side but is unwired (see #3).
3. **Quote loop unusable from UI** — `submit_quote`/`list_quotes_for_order`/`respond_to_quote` have **no** `api.ts` methods. Without this, customers can't accept tailor quotes → orders can't progress past `pending_quote` through the intended path. `orders.py:200,304,237`.
4. **Secure top-up + admin approval unwired** — `paymentTopup`/`getPendingTopups`/`approveTopup` exist in `api.ts` (192/199/203) but are called nowhere; no receipt-upload UI. Net: the *only* working top-up is the unsafe one in #1.

### P1 — serious (security / correctness / major missing UI)
5. **Order status authz gap** — `PUT /orders/{id}/status` validates the state machine but not ownership; any authed user can transition any order. `orders.py:128-174`.
6. **Quote accept double-charge** — re-POST re-deducts balance & re-pays designer; no idempotency guard. `orders.py:237-301`.
7. **`deleteDesignAsset` id-type mismatch** — scanner parts have string ids (e.g. `front_neckline_VNeck`); `DELETE /parts/{id}` expects int → 422/404. `api.ts:419` ← `AdminDesignAssets.tsx:81` vs `catalogs.py:196`.
8. **Order detail never fetched** — `getOrderDetail` unused → `App.tsx:163` fills `design:{}`/`measurements:{}`; order screens show no design/measurements/quotes.
9. **Order chat & support chat unwired** — backend REST+WS present; no FE connectors (`api.ts` has no chat/support/WS methods).
10. **No UI for:** change-password, order-cancel, transactions history, design reviews.
11. **Weak token invalidation** — `pwh` fingerprint = `$2b$12$`+1 salt char (~6 bits); probabilistic. `auth.py:19`, `deps.py:51`.
12. **Escrow release never scheduled** — only lazy on `GET /orders/{id}`; `release_pending_balances()` uncalled. `orders.py:82`, `escrow.py:7`.

### P2 — robustness / maintainability / minor UX
13. Portfolio items can't be **edited** (only create/approve/reject); **delete** route exists but unwired (`portfolio.py:89`).
14. Dress-part **update** route unwired (`catalogs.py:178`, no `updatePart` in `api.ts`).
15. Categories/Shipping/site-settings admin routes unwired (above table).
16. `create_design` accepts any role (`catalogs.py:90`); WS `sub` type bug + no `pwh`/`is_active` re-check (`chat.py:47`, `support_chat.py:331`).
17. `datetime.utcnow()` (naive) vs tz-aware columns; deprecated (`orders.py:86,153`, `escrow.py:8`).
18. Schema via `create_all` not Alembic (`main.py:26`); SQLite default; `pymysql` unused.
19. Tailwind via CDN in `index.html`; signup still offers `manager` (`LoginPage.tsx:177`); dev proxy → `:8002` but `run.py` → `:8000`.
20. Upload reads whole file before size check + leaks exception text (`file_upload.py:35`, `upload.py:23`); no rate limiting anywhere.

---

## Status by layer
- **Backend:** mature, mostly correct; gaps are (a) the C1/C2 payment safety, (b) the C3/C4 order/quote authz & idempotency, (c) ops (escrow scheduler, migrations, rate limiting), (d) the product-review stub.
- **Frontend:** the limiting factor. Admin/profile/storefront surfaces are built; the **transactional marketplace core (quotes, chat, escrow top-up, order detail, reviews) is not wired**.
- **Integration:** ~17 backend capabilities have no caller (see table). This is where most remediation effort actually sits.

## Scope notes (what this audit did and did not do)
- **Did:** read every backend router/model/schema/service and the frontend API layer, contexts, `App.tsx`, dashboard components; built an exact wired-vs-dead endpoint map (`grep` of `api.<method>` call sites).
- **Did not:** run the dev server or browser-test/screenshot (Phase 2), and did not research/plan OpenAI image generation (Phase 3). The driving request was internally contradictory and ended mid-sentence at "NEW DIRECTIVE:", so those heavier/irreversible steps (and the requested `git commit`) are **paused pending your confirmation** — see the question posted in chat. CRUD status here is therefore **code-level**, not runtime-verified.
