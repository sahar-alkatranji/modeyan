# QA Report - Modeya Frontend

**Reviewer:** Senior QA Engineer  
**Date:** 2026-05-22  
**Scope:** React + TypeScript + Tailwind CSS — Arabic RTL fashion design platform  
**Files reviewed:** App.tsx, UserDashboard.tsx, Header.tsx, Hero.tsx, all dashboard components, ar.ts, en.ts

---

## Critical Issues (must fix)

### RTL Layout

- **[UserDashboard] Desktop sidebar anchored to wrong side for RTL** — Desktop sidebar uses `fixed left-0` and main content uses `md:ml-64`. In Arabic RTL, the sidebar should be on the right with `right-0` and content should use `md:mr-64` (or logical `ms-64`). The layout is visually reversed in Arabic mode. | `UserDashboard.tsx:194, 330`

- **[UserDashboard] Mobile drawer slides from wrong side in RTL** — Mobile drawer uses `left-0` with `-translate-x-full` / `translate-x-0` toggle. In Arabic RTL, the drawer should slide in from the right (`right-0`, reversed translate direction). | `UserDashboard.tsx:267`

- **[UserDashboard] Wallet payment detail labels hardcoded in Arabic dialect** — Labels `رقم الهاتف:`, `رمز الدفع:`, `اسم الحساب:`, `البنك:`, `رقم الحساب:` are hardcoded Arabic strings that bypass the translation system entirely. They display in Arabic even when the UI language is English. | `UserDashboard.tsx:435, 440, 445, 450, 455`

- **[AdminPayments] Hardcoded Arabic dialect hint text in admin form** — The string `هاد الرمز بيظهر للمستخدم بصفحة الدفع` (colloquial Syrian Arabic) is hardcoded inside the Configure Payment modal, shown even in English mode. | `AdminPayments.tsx:319, 373`

### Missing Mobile Navigation

- **[Header] No mobile navigation menu** — The desktop nav is `hidden md:flex` but no mobile hamburger/drawer is implemented (see comment at line 114). On mobile screens, users cannot reach Shop, About, or Contact pages at all. This is a complete navigation failure for mobile users. | `Header.tsx:39, 114`

### Untranslated Admin UI (Arabic users see raw English)

- **[AdminOrders] All action button labels hardcoded English** — "Approve Quote", "Reject", "Mark Completed", and "Cancel" buttons in the orders table are hardcoded English, not using the translation system. These appear in the primary admin workflow. | `AdminOrders.tsx:133, 140, 149, 158`

- **[AdminOrders] "Date" and "Actions" column headers hardcoded English** — Table header cells for Date and Actions render raw English in Arabic mode. | `AdminOrders.tsx:97, 98`

- **[AdminOrders] Pagination controls all hardcoded English** — "Previous", "Page {n} of {m}", and "Next" pagination labels are hardcoded English strings. | `AdminOrders.tsx:186, 190, 196`

- **[ProfessionalPortfolio] Approve/Reject buttons hardcoded English** — The primary manager approval workflow buttons display "Approve" and "Reject" in hardcoded English. | `ProfessionalPortfolio.tsx:181, 187`

- **[AdminDesignAssets] Filter labels and type dropdown all hardcoded English** — The "All Options" filter button and all assetTypes array labels ('Front Neckline', 'Back Neckline', 'Fabric / Material', 'Skirt Style', 'Train / Tail') are hardcoded English. The `<select>` options in the Add modal are also hardcoded English. | `AdminDesignAssets.tsx:28–33, 119, 207–213`

- **[UserDashboard] "Bio" profile label hardcoded English** — Uses raw `<label>Bio</label>` instead of `t('profile_label_bio')` which exists in both translation files. | `UserDashboard.tsx:493`

- **[UserDashboard] "Date" column header hardcoded English in personal orders table** | `UserDashboard.tsx:515`

### Mobile Overflow / Broken Layouts

- **[UserDashboard] Personal orders table has no horizontal scroll** — `table w-full` has no `overflow-x-auto` wrapper. On screens narrower than ~640px the table overflows the viewport without scroll. | `UserDashboard.tsx:509–530`

- **[UserDashboard] Requests table has no horizontal scroll** — Same overflow issue for the Requests view table. | `UserDashboard.tsx:543–566`

- **[AdminOrders] Status filter row overflows on mobile** — `flex gap-2` with 6 buttons ('all', 'pending', 'pending_quote', 'approved', 'completed', 'cancelled'). No `flex-wrap` or scroll container; overflows on screens < 480px. | `AdminOrders.tsx:69–86`

### Logic / Data Bugs

- **[App.tsx] Auth redirect effect missing `currentPage` dependency** — The redirect effect uses `currentPage` but it is absent from the `useEffect` dependency array `[isLoading, isAuthenticated]`. Stale closure: redirect may not fire or may fire on the wrong page when state changes race. | `App.tsx:146–152`

- **[UserDashboard] Customer ID type mismatch in order filter** — `orders.filter(o => o.customerId === authUser?.id)` compares `customerId` (string, mapped via `String(ord.customer_id)` in App.tsx) against `authUser?.id` which may be a number from the API. Strict `===` between `"5"` and `5` is always `false`, making the personal orders list permanently empty. | `UserDashboard.tsx:519, App.tsx:129`

---

## Medium Issues (should fix)

### RTL — Toggle Switches

- **[AdminPayments] Toggle switch hard-wired for LTR** — Custom CSS toggle uses `after:left-[2px]` and `peer-checked:after:translate-x-full`. Thumb starts from the wrong side in RTL. Needs `rtl:after:right-[2px] rtl:after:left-auto` and a negated translate. | `AdminPayments.tsx:230`

- **[AdminSocials] Toggle switch hard-wired for LTR** — Same toggle pattern, same RTL bug. | `AdminSocials.tsx:117`

### RTL — Header Spacing

- **[Header] `space-x-*` utilities used instead of `gap`** — `space-x-8`, `space-x-5`, `space-x-4` add `margin-left` (LTR-only). These do not reverse in RTL. Nav items stay in left-to-right order even in Arabic mode. Replace with `gap` inside `flex`. | `Header.tsx:39, 52, 68`

### Mobile UX

- **[Hero] `bg-fixed` broken on iOS Safari** — `background-attachment: fixed` is unsupported on iOS Safari; the hero parallax effect does not render — the background image appears zoomed or misaligned. Affects the majority of Arabic mobile users. | `Hero.tsx:13`

- **[AdminProducts] Edit/Delete accessible only via hover** — Edit/Delete overlay uses `opacity-0 group-hover:opacity-100`. Hover events do not fire on touch screens. Mobile users cannot edit or delete any product. | `AdminProducts.tsx:183–199`

- **[AdminUsers] Action buttons accessible only via hover** — Table row actions use `md:opacity-0 group-hover:opacity-100`. On mobile/touch, they are permanently invisible; the admin cannot manage wallet or delete users from mobile. | `AdminUsers.tsx:215`

- **[DesignStudio] Sticky preview panel unreachable on mobile** — Preview uses `sticky top-6` inside `grid lg:grid-cols-3`. On mobile (single column) there is no scroll container for sticky to activate. The user must scroll past all part-pickers to reach the preview and Save button. | `DesignStudio.tsx:137`

### UI/UX Consistency

- **[AdminPayments] Logo image AND fallback icon both always render** — Payment method card renders the logo `<img>` AND the fallback icon `<div>` unconditionally side-by-side. `onError` only hides a broken image. When a valid `imgUrl` is set, both the logo and a generic icon box are visible simultaneously. | `AdminPayments.tsx:206–219`

- **[ConfirmDialog] Default button labels are hardcoded English** — `confirmText="Confirm"` and `cancelText="Cancel"` default props are raw English strings, not `t()` calls. Any usage without explicit translated text overrides shows English buttons in Arabic mode. | `DashboardShared.tsx:72, 80`

- **[UserDashboard] Avatar initials always hardcoded role abbreviation** — Sidebar footer avatar shows hardcoded "AD" (manager) and "US" (everyone else) instead of actual user first/last name initials. Affects desktop and mobile sidebars. | `UserDashboard.tsx:244, 309`

- **[ManagerOverview] Metric card trend values hardcoded** — Trend badges show static strings "12%", "5%", "20%" that are always green-positive, regardless of actual data. | `ManagerOverview.tsx:163–165`

- **[ProfessionalPortfolio] "Pending Approvals" view shows all items, not just pending** — Manager sees all portfolio items (approved + rejected + pending) because `portfolioItems` is unfiltered for the manager branch. Action buttons are hidden for non-pending items, but the section is confusingly titled "Pending Approvals". | `ProfessionalPortfolio.tsx:38–40, UserDashboard.tsx:380–387`

- **[StripePaymentForm] Imported but never rendered** — `StripePaymentForm` is imported in `UserDashboard.tsx:9` but is never rendered in any view. Dead import. | `UserDashboard.tsx:9`

- **[AdminUsers] Wallet update shows no success feedback** — `handleWalletSubmit` closes the modal on success without displaying any confirmation message. | `AdminUsers.tsx:72–79`

- **[ManagerOverview] Non-customer role overview shows wrong metric label** — For tailor/designer roles, the second metric card label is `wallet_pending_balance` but the value is `authUser?.balance` (current balance). Mismatched label and data. | `ManagerOverview.tsx:51–54`

---

## Minor Issues (nice to fix)

- **[UserDashboard] Wallet balance shows "0.00" flash on load** — `walletBalance` initialises to `authUser?.balance || 0`. Brief flash before API resolves. | `UserDashboard.tsx:56`

- **[DesignStudio] All saved designs share the same name** — Save handler hardcodes `name: 'dashboard_design_default_name'` (raw translation key). Every saved design shows the same name in My Designs. | `DesignStudio.tsx:180`

- **[MyDesigns] Design forwarded with invalid database ID** — `parseInt(design.id)` where `design.id` was set to `Date.now().toString()` (a 13-digit timestamp). Not a valid DB record ID; API call fails silently. | `MyDesigns.tsx:25, DesignStudio.tsx:180`

- **[DashboardShared] StatusPill renders raw English status text** — `{status.toLowerCase()}` inside the pill renders raw API values ("pending", "approved", etc.) in English even in Arabic mode. Should use `t(\`status_\${status.toLowerCase()}\`)`. | `DashboardShared.tsx:44`

- **[AdminDesignAssets] `replace('_', ' ')` only replaces first underscore** — Should use `.split('_').join(' ')` for robustness. | `AdminDesignAssets.tsx:161`

- **[AdminDesignAssets] ConfirmDialog title and confirm button use identical key** — Both `title` and `confirmText` use `t('admin_design_assets_delete_confirm')`, resulting in a full question sentence as the button label. | `AdminDesignAssets.tsx:252, 254`

- **[App.tsx] Footer always mounts even on full-screen dashboard** — `<Footer>` renders on every page including `user-dashboard` where it is hidden behind `fixed inset-0`. Unnecessary mount. | `App.tsx:308`

- **[DashboardShared] MetricCard trend always green** — Trend badge uses `text-green-400` unconditionally. Negative trend values still render green. | `DashboardShared.tsx:56`

---

## Missing Translations

The following keys are used in code but absent from one or both translation files:

| Key | Used In | Missing From | Notes |
|-----|---------|-------------|-------|
| `header_logout` | `Header.tsx:89` | **ar.ts AND en.ts** | Falls back to hardcoded `'Logout'` |
| `header_dashboard` | `Header.tsx:83` | **en.ts only** | Present in ar.ts:11, missing from en.ts |
| `wallet_payment_methods` | `UserDashboard.tsx:423` | **ar.ts AND en.ts** | Fallback is hardcoded Arabic — shows Arabic in English mode |
| `admin_payments_field_payment_code` | `AdminPayments.tsx:310, 364` | **ar.ts AND en.ts** | Falls back to mixed EN/AR string |
| `category_long` | `AdminProducts.tsx:37, 181` | **ar.ts AND en.ts** | Shows raw key "category_long" in UI |
| `category_short` | `AdminProducts.tsx:38, 181` | **ar.ts AND en.ts** | Shows raw key |
| `category_summer` | `AdminProducts.tsx:39, 181` | **ar.ts AND en.ts** | Shows raw key |
| `category_winter` | `AdminProducts.tsx:40, 181` | **ar.ts AND en.ts** | Shows raw key |
| `category_spring` | `AdminProducts.tsx:41, 181` | **ar.ts AND en.ts** | Shows raw key |
| `category_autumn` | `AdminProducts.tsx:42, 181` | **ar.ts AND en.ts** | Shows raw key |
| `dashboard_menu_admin_products_subtitle` | Unused in code | **en.ts only** | Defined in ar.ts:227, no English equivalent |

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 15 |
| Medium | 15 |
| Minor | 8 |
| Missing translation keys | 11 |

**Top priority fix sequence:**
1. Add mobile hamburger nav to `Header.tsx` (complete navigation failure)
2. Fix customer ID type mismatch (personal orders always empty)
3. Fix sidebar RTL direction (`left-0` → `right-0` with `rtl:` variants)
4. Translate all hardcoded action labels in AdminOrders and ProfessionalPortfolio
5. Add `overflow-x-auto` to the two personal tables in UserDashboard
6. Add the 11 missing translation keys to both ar.ts and en.ts

---

*End of QA Report*
