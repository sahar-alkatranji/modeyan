# 01 — CRUD Status (per entity)

**Date:** 2026-06-08 · **Verification level: CODE-LEVEL** (static trace backend route ⇄ `services/api.ts` ⇄ component call site). Not runtime/browser-verified. Line numbers as-read 2026-06-08.

### Legend
- ✅ **works** — wired end-to-end, logic looks correct.
- ⚠ **works-but-flawed** — reachable but unsafe/incorrect/edge-broken.
- 🔌 **backend-only** — endpoint exists; `api.ts` method may exist; **no component calls it** → no UI.
- ❌ **missing** — no `api.ts` method at all (and/or no route) → cannot be done from UI.

Columns: **Backend route** (`file:line`) · **api.ts** (`method:line`, `—`=none) · **Caller** (`component:line`, `—`=none) · **Status & notes**.

---

## USERS
| Op | Backend route | api.ts | Caller | Status & notes |
|----|---------------|--------|--------|----------------|
| Create (self) | `POST /auth/register` `auth.py:25` | `register:141` | `AuthContext`/`LoginPage` | ✅ role validator blocks privileged roles. |
| Create (admin) | `POST /users` `auth.py:152` | `createUser:432` | `AdminUsers.tsx:115` | ✅ returns `UserResponse` (no token swap). |
| Read (list) | `GET /users` `auth.py:103` | `getUsers:339` | `UserDashboard.tsx:109` | ✅ admin-only, paginated. |
| Read (one) | `GET /users/{id}` `auth.py:118` | — | — | 🔌 no single-user fetch in UI. |
| Read (me) | `GET /auth/me` `auth.py:67` | `getMe:163` | `AuthContext` | ✅ |
| Update (self) | `PUT /auth/me` `auth.py:72` | `updateMe:167` | `UserDashboard.tsx:87,546` | ✅ strips role/email. |
| Update (admin) | `PUT /users/{id}` `auth.py:133` | `updateUser:423` | `AdminUsers.tsx:180` | ✅ email+role editable. |
| Delete | `DELETE /users/{id}` `auth.py:176` | `deleteUser:344` | `AdminUsers.tsx:153` | ✅ soft (`is_active=False`); **no reactivate UI**. |
| Wallet adjust (admin) | `PUT /admin/users/{id}/wallet` `admin.py:65` | `updateUserWallet:260` | `AdminUsers.tsx:84` | ✅ row-lock + Decimal. |
| Change password | `PUT /auth/change-password` `auth.py:89` | `changePassword:174` | — | ❌ **no UI** (method unused). |

## PRODUCTS  (frontend "products" == backend **Designs**)
| Op | Backend route | api.ts | Caller | Status & notes |
|----|---------------|--------|--------|----------------|
| Create | `POST /designs` `catalogs.py:90` | `createProduct:353` / `createDesign:227` | `AdminProducts.tsx:165` / `DesignStudio.tsx:258` | ✅ ⚠ any authed role may create (`BL-6`). |
| Read (list) | `GET /designs` `catalogs.py:60` | `getDesigns:219` | `App.tsx:82` | ✅ + bundled fallback. |
| Read (one) | `GET /designs/{id}` `catalogs.py:72` | — | — | 🔌 detail (incl. reviews) never fetched. |
| Update | `PUT /designs/{id}` `catalogs.py:103` | `updateProduct:360` | `AdminProducts.tsx:145` | ✅ owner/manager. |
| Delete | `DELETE /designs/{id}` `catalogs.py:123` | `deleteProduct:367` | `AdminProducts.tsx:199` | ✅ soft delete. (`deleteDesign:234` unused.) |

## DESIGN ASSETS / DRESS PARTS
| Op | Backend route | api.ts | Caller | Status & notes |
|----|---------------|--------|--------|----------------|
| Create | `POST /parts` `catalogs.py:39` | `createDesignAsset:407` | `AdminDesignAssets.tsx:51` | ⚠ maps FE `type`→`category`; verify value is a valid `PartCategory` enum or it 422s. designer/manager only. |
| Read (scanner) | `GET /parts/scanner/{c}` `catalogs.py:52` | `getScannerParts:215` | `App.tsx:113` | ✅ disk scan, public. |
| Read (db) | `GET /parts` `catalogs.py:19` | `getParts:210` | — | 🔌 unused (scanner used instead). |
| Update | `PUT /admin/parts/{id}` `catalogs.py:178` | — | — | ❌ **no UI** (no `updatePart`). |
| Delete | `DELETE /admin/parts/{id}` `catalogs.py:196` | `deleteDesignAsset:419` | `AdminDesignAssets.tsx:81` | ⚠ **broken for scanner parts**: ids are strings (`front_neckline_VNeck`); route expects `int` → 422/404. Works only for DB-backed int ids. |

## ORDERS
| Op | Backend route | api.ts | Caller | Status & notes |
|----|---------------|--------|--------|----------------|
| Create | `POST /orders` `orders.py:34` | `createOrder:242` | `MyDesigns.tsx:31` | ✅ customer/manager. |
| Read (list) | `GET /orders` `orders.py:53` | `getOrders:238` | `App.tsx:161` | ✅ but mapped to empty `design`/`measurements` (`App.tsx:163`). |
| Read (one) | `GET /orders/{id}` `orders.py:72` | `getOrderDetail:331` | — | ❌ **never called** → no order-detail view; also where lazy escrow release lives → release rarely triggers. |
| Read (admin) | `GET /admin/orders` `admin.py:204` | `getAdminOrders:335` | — | 🔌 unused. |
| Update (status) | `PUT /orders/{id}/status` `orders.py:128` | `updateOrderStatus:249` | `AdminOrders.tsx:38` | ⚠ **P1**: state machine OK, **no ownership check** (C3). |
| Delete (cancel) | `DELETE /orders/{id}` `orders.py:345` | `cancelOrder:327` | — | ❌ **no cancel UI**. |

## QUOTES  — **entire subsystem unwired (P0)**
| Op | Backend route | api.ts | Caller | Status & notes |
|----|---------------|--------|--------|----------------|
| Create (tailor) | `POST /quotes` `orders.py:200` | — | — | ❌ tailors cannot submit quotes from UI. |
| Read (per order) | `GET /orders/{id}/quotes` `orders.py:304` | — | — | ❌ customers can't see quotes. |
| Respond (accept/reject) | `PUT /quotes/{id}/respond` `orders.py:237` | — | — | ❌ + ⚠ non-idempotent double-charge if ever called (C4). |

## PORTFOLIOS
| Op | Backend route | api.ts | Caller | Status & notes |
|----|---------------|--------|--------|----------------|
| Create | `POST /portfolio` `portfolio.py:11` | `createPortfolio:440`→`createPortfolioItem:312` | `ProfessionalPortfolio.tsx:81` | ✅ tailor/designer/manager. |
| Read (mine/all) | `GET /portfolio` `portfolio.py:34` | `getPortfolio:304` | `UserDashboard.tsx:141` | ✅ manager sees all. |
| Read (pending) | `GET /portfolio/pending` `portfolio.py:48` | `getPendingPortfolio:308` | — | 🔌 unused. |
| Update (fields) | — (no route) | — | — | ❌ **cannot edit** a portfolio item after creation. |
| Update (approve/reject) | `PUT /portfolio/{id}/approve\|reject` `portfolio.py:59,74` | `updatePortfolioStatus:444` | `ProfessionalPortfolio.tsx:122` | ✅ |
| Delete | `DELETE /portfolio/{id}` `portfolio.py:89` | — | — | ❌ **no delete UI** (route exists). |

## WALLET / TOP-UP / TRANSACTIONS
| Op | Backend route | api.ts | Caller | Status & notes |
|----|---------------|--------|--------|----------------|
| Read balance | `GET /wallet` `auth.py:190` | `getWallet:181` | `UserDashboard.tsx:100,433` | ✅ |
| Top-up (instant) | `POST /wallet/top-up` `auth.py:195` | `topUpWallet:185` | `UserDashboard.tsx:433` | ⚠ **P0** free money, no payment (C1). |
| Top-up (secure/pending) | `POST /wallet/payment-topup` `transactions.py:105` | `paymentTopup:192` | — | 🔌 **P0** unwired; no receipt-upload UI. |
| Pending list (admin) | `GET /wallet/pending-topups` `transactions.py:141` | `getPendingTopups:199` | — | 🔌 admins can't see requests. |
| Approve/reject (admin) | `PUT /wallet/approve-topup/{id}` `transactions.py:168` | `approveTopup:203` | — | 🔌 admins can't approve. |
| Transactions list | `GET /transactions` `transactions.py:29` | `getTransactions:348` | — | ❌ **no ledger UI**. |

## ORDER CHAT
| Op | Backend route | api.ts | Caller | Status & notes |
|----|---------------|--------|--------|----------------|
| Read messages | `GET /orders/{id}/messages` `transactions.py:44` | — | — | ❌ unwired. |
| Send message | `POST /orders/{id}/messages` `transactions.py:74` | — | — | ❌ unwired. |
| Realtime | `WS /ws/chat/{order_id}` `chat.py:40` | — | — | ❌ no WS connector (I7). |

## SUPPORT CHAT — **entire subsystem unwired**
| Op | Backend route | api.ts | Caller | Status & notes |
|----|---------------|--------|--------|----------------|
| Create / List / Get / Update / Claim / Messages | `support_chat.py:122,142,187,219,254,274,305` | — | — | ❌ no `api.ts` methods. |
| Realtime | `WS /ws/support/{chat_id}` `support_chat.py:324` | — | — | ❌ no connector. |

## REVIEWS
| Op | Backend route | api.ts | Caller | Status & notes |
|----|---------------|--------|--------|----------------|
| Design review create | `POST /designs/{id}/reviews` `catalogs.py:139` | — | — | ❌ unwired. |
| Design reviews read | via `GET /designs/{id}` `catalogs.py:80` | — | — | ❌ (detail never fetched). |
| Product review read/create | `catalogs.py:213,234` | — | — | ⚠❌ **STUB** — persists nothing, and unwired. |

## CATEGORIES / SHIPPING / SOCIAL / PAYMENT METHODS / SETTINGS / STATS / AUTH
| Op | Backend route | api.ts | Caller | Status & notes |
|----|---------------|--------|--------|----------------|
| Categories list | `GET /categories` `categories.py:11` | — | — | ❌ FE uses hardcoded shop categories. |
| Categories admin CRUD | `categories.py:18,34,52` | — | — | ❌ unwired. |
| Shipping list | `GET /shipping-policies` `shipping.py:11` | — | — | ❌ `ShippingPolicyPage` uses translations, not API. |
| Shipping admin CRUD | `shipping.py:18,31,49` | — | — | ❌ unwired. |
| Social read | `GET /admin/social-links` `admin.py:145` | `getSocialLinks:289` | `App.tsx:143` | ✅ public. |
| Social bulk update | `PUT /admin/social-links` `admin.py:152` | `updateSocialLinks:293` | `AdminSocials.tsx:58` | ✅ upsert; no per-item delete (by design). |
| Payment methods read | `GET /admin/payment-methods` `admin.py:92` | `getPaymentMethods:267` | `UserDashboard.tsx:125` | ✅ |
| Payment methods create/update | `admin.py:100,113` | `createPaymentMethod:278`/`updatePaymentMethod:271` | `AdminPayments.tsx:153,79,125` | ✅ |
| Payment methods delete | `DELETE /admin/payment-methods/{id}` `admin.py:131` | `deletePaymentMethod:285` | — | 🔌 no delete UI. |
| Public settings read | `GET /admin/settings/public` `admin.py:24` | `getPublicSettings:300` | `DesignStudio.tsx:51` | ✅ (correctly omits secret key). |
| Admin settings read/update | `GET/PUT /admin/settings` `admin.py:174,182` | — | — | ❌ no settings editor UI. |
| Admin stats | `GET /admin/stats` `admin.py:40` | `getAdminStats:256` | `UserDashboard.tsx:159` | ✅ |
| Login / Register | `auth.py:46,25` | `login:126`/`register:141` | `AuthContext` | ✅ |
| Upload | `POST /upload` `upload.py:12` | `uploadFile:371` | `UserDashboard.tsx:85`,`AdminProducts.tsx:94`,`ProfessionalPortfolio.tsx:55` | ⚠ reads whole file before size check; leaks error text. |
| AI generate (server) | `POST /ai/generate-image` `ai.py:17` | — | — | 🔌 unused; FE calls Gemini client-side instead. |

---

## Roll-up counts (code-level)
- ✅ works: **~24** operations · ⚠ works-but-flawed: **~5** · 🔌 backend-only (no UI): **~12** · ❌ missing/cannot-do-from-UI: **~20**.
- The marketplace's **transactional core** (quotes, escrow top-up approval, order detail, order/support chat, reviews, transaction ledger) is overwhelmingly in the ❌/🔌 columns.

> Runtime caveat: statuses marked ✅ are code-traced, not browser-verified. Phase-2 browser testing (paused pending confirmation) would convert these to runtime-confirmed and may reveal data-shape mismatches not visible statically (e.g. the `createDesignAsset` type→category mapping, decimal/float rendering).
