# Angels Beauty — Phase 2 Report: Customer Shopping Experience

**Status:** Complete. Stopping for review per instruction.
**No live payment processing, shipping integration, or admin development begun.**
**Production Supabase and Cloudinary untouched.**

---

## What was built

### 1. Persistent shopping cart ✅
- **Server-side cart** (`Cart`/`CartItem` tables in the isolated dev Postgres DB). Authenticated users get a cart tied to their account; guests get an anonymous cart tied to an HTTP-only `angels_guest_sid` cookie (persists 30 days).
- Add, remove, quantity adjust (±), with **stock-limit handling** (server rejects qty > available stock; merges duplicate lines capped at stock).
- **Subtotal computed server-side** from DB prices (never trusted from the client).
- Cart page (`/cart`) with item list, qty controls, remove, live subtotal, empty state, and "Proceed to Checkout."
- Header cart badge updates live across all components via a shared Zustand count synced from the server.

### 2. Persistent wishlist ✅
- **Server-side wishlist** (`WishlistItem` table) for authenticated users (add/remove, persists across devices/sessions).
- Guests fall back to in-memory state with a "sign in to save" prompt.
- Wishlist page (`/wishlist`) with items, add-to-cart, remove, empty state, and sign-in prompt for guests.

### 3. Customer authentication ✅
- **NextAuth.js v4**, credentials provider, **JWT (stateless)** sessions, **bcrypt** password hashing (10 rounds).
- **Registration** (`/register`) — validates name/email/password, checks duplicate email, hashes password, auto-signs-in.
- **Login** (`/login`) — credentials sign-in with callback URL.
- **Logout** — via the account page sign-out button.
- **Password reset** — `/forgot-password` (creates a `VerificationToken`, 1-hour expiry; reset link logged to server console in dev) + `/reset-password` (validates token, updates password, marks token used).
- **Session management** — HTTP-only JWT cookie signed with `NEXTAUTH_SECRET`; sessions carry `{ id, email, role }`.
- **Middleware** protects `/account/*` (defense-in-depth; every handler also calls `requireSession()`). `/checkout` is open to guests.

### 4. Customer account pages ✅
- `/account` — profile (name, email, member since, email-verified status, order count) + sign-out.
- `/account/addresses` — saved addresses (add via validated form, set default, remove) — `Address` table.
- `/account/orders` — order history (order number, date, status, total, items) — reads from the `Order` table.

### 5. Guest checkout ✅
- `/checkout` — shipping address, billing address (or "same as shipping"), email, order note, and a live order summary (items, subtotal, shipping, total).
- **Server-side price + stock validation** before the order is created: every line is re-fetched from the DB, price recomputed, stock checked (`POST /api/checkout`).
- Creates the order in a single **Prisma `$transaction`**: `Order` (PENDING), `OrderItem` (snapshot: name, sku, unitCents, qty, lineCents, imageUrl), addresses, a `Payment` row (PENDING, idempotency key), deducts inventory, and clears the cart.
- Order confirmation page (`/checkout/confirmation/[orderNumber]`) — order number, status, items, total.
- **No payment is processed** — order is `PENDING` / `paymentStatus: PENDING` (Clover wiring is Phase 3, per instruction).

### 6. Validation, loading states, empty states, error handling ✅
- **Zod schemas** shared client/server (`src/lib/schemas.ts`) for register, login, forgot/reset password, address, checkout, cart.
- Loading states on every form (spinners, disabled buttons, "Placing order…").
- Empty states on cart, wishlist, orders, addresses.
- Consistent JSON error shape `{ error: { code, message, fields } }`; field-level errors surfaced in forms; toast notifications for success/error.

### 7. Responsive desktop + mobile ✅
- All Phase 2 pages use the approved design system (forest green / blush pink / cream, sans-serif headings, pill buttons, shadcn/ui inputs) via the shared `StorefrontShell`.
- Verified on desktop (1440px) and mobile (iPhone 14, 390px); sticky header + footer throughout.

---

## Security checks ✅

| Requirement | Implementation |
|---|---|
| Protect customer data with server-side authorization | `requireSession()` called inside every protected Route Handler + Server Action; middleware is defense-in-depth only. Wishlist/address/order APIs verify ownership before returning/mutating. |
| Do not expose sensitive info through public APIs | `passwordHash` is never selected onto tokens/sessions/responses. Auth endpoints never reveal whether an email exists (forgot-password always returns the same message). |
| Secure password handling + session management | bcrypt (10 rounds); JWT HTTP-only cookie signed with `NEXTAUTH_SECRET`; 30-day expiry; no plaintext passwords anywhere. |
| Calculate prices + validate stock server-side before any real order | Checkout re-fetches every variant from the DB, recomputes unit/line/subtotal, and rejects if qty > stock — all inside the transaction. Client-submitted prices are ignored. |
| Do not store payment card details | No card fields collected or stored. The `Payment` row stores only `provider`, `idempotencyKey`, `amountCents`, `status`, and a sanitized `raw` (Phase 3). |
| No live Clover / EasyPost | No payment calls; shipping is a flat rule ($5.99, free over $50). Order is `PENDING`. |
| No production Supabase/Cloudinary modification | Catalog is a static TS module; the dev DB (`angels_dev`) was seeded locally from the CSV. No external accounts touched. |

---

## Persistence ✅

- **Git commits survive sandbox resets** — proven: this session's earlier commits (`41a506c`, `2a9576a`) persisted through an environment reset that wiped uncommitted working-tree changes. All Phase 2 work is now committed (`f499f44`, `3a897aa`).
- **Verified external backup** — `download/angels-beauty-repo-backup.bundle` (6.0 MB, "complete history", verified via `git bundle verify`) + `download/angels-beauty-project-backup.tar.gz` (32 MB, source + images, excludes node_modules/.next). Download these out of the sandbox for off-environment safekeeping.
- **Dev DB reproducible** — `scripts/setup-dev-postgres.sh` (no-root Postgres) → restore `.env` → `prisma migrate deploy` → `prisma generate` → `scripts/seed-catalog.ts` (repopulates the 72-product catalog). Backups: `scripts/dev-db-backup.sh` / `dev-db-restore.sh`.
- Note: `.env` does not persist across resets; the recovery procedure rewrites it (Postgres URL + `NEXTAUTH_SECRET`).

---

## Test results

| Check | Result |
|---|---|
| ESLint (`bun run lint`) | ✓ clean, 0 errors |
| Routes | ✓ all storefront/auth/cart/wishlist/checkout pages 200; `/account/*` redirects to `/login` when unauthenticated (correct) |
| APIs | ✓ `/api/cart` 200, `/api/wishlist` 200; `/api/auth/register` + `/api/checkout` accept POST (405 on GET — correct) |
| Register → auto sign-in → /account | ✓ verified in-browser |
| Login (credentials) | ✓ verified |
| Add to cart (guest + authed) | ✓ items persist, subtotal computed server-side, header badge updates live |
| Cart qty/remove + stock limit | ✓ server rejects qty > stock with a clear error |
| Guest checkout end-to-end | ✓ order created (`AB-MWJPDLFG-806862`, $45.97), inventory deducted, cart cleared, confirmation page renders |
| Account: profile / addresses / orders | ✓ render; address add/remove/default verified; orders reads from DB |
| Wishlist (authed add/remove + guest prompt) | ✓ verified |
| Password reset flow | ✓ token created + validated; password updated |
| Mobile responsive (iPhone 14) | ✓ all pages render; sticky header/footer |

---

## Screenshots (desktop 1440px + mobile iPhone 14)

| Page | Desktop | Mobile |
|---|---|---|
| Login | `/tmp/phase2-desktop-login.png` | `/tmp/phase2-mobile-login.png` |
| Register | `/tmp/phase2-desktop-register.png` | — |
| Cart (populated) | `/tmp/phase2-desktop-cart.png` | `/tmp/phase2-mobile-cart.png` |
| Checkout (populated) | `/tmp/phase2-desktop-checkout.png` | `/tmp/phase2-mobile-checkout.png` |
| Wishlist | `/tmp/phase2-desktop-wishlist.png` | `/tmp/phase2-mobile-wishlist.png` |
| Account (profile) | `/tmp/phase2-desktop-account.png` | `/tmp/phase2-mobile-account.png` |
| Account — Orders | `/tmp/phase2-desktop-account-orders.png` | — |

**Live:** Preview Panel on the right → `/login`, `/register`, `/cart`, `/checkout`, `/wishlist`, `/account` (sign in first).

---

## Files added/changed (Phase 2)
- **Auth:** `src/lib/auth.ts`, `src/lib/session.ts`, `src/middleware.ts`, `src/app/api/auth/[...nextauth]/`, `register`, `forgot-password`, `reset-password` routes, `src/app/{login,register,forgot-password,reset-password}/page.tsx`, `src/components/{providers,auth-shell,sign-out-button}.tsx`.
- **Cart:** `src/lib/cart-server.ts`, `src/lib/cart-client.ts`, `src/app/api/cart/` (+ items/[id]), `src/app/cart/page.tsx`.
- **Wishlist:** `src/app/api/wishlist/route.ts`, `src/lib/wishlist-client.ts`, `src/app/wishlist/page.tsx`.
- **Account:** `src/app/account/{page,addresses/page,orders/page}.tsx`, `src/components/site/{account-nav,address-form}.tsx`, `src/app/api/account/addresses/`.
- **Checkout:** `src/app/api/checkout/route.ts`, `src/app/checkout/page.tsx`, `src/app/checkout/confirmation/[orderNumber]/page.tsx`.
- **Shared:** `src/lib/schemas.ts` (Zod), `src/components/site/storefront-shell.tsx`, layout (SessionProvider), header/cart-card/purchase wiring, `scripts/seed-catalog.ts`.
- **Backups:** `download/angels-beauty-repo-backup.bundle`, `download/angels-beauty-project-backup.tar.gz`.

---

## Known limitations / next steps
- **No payment processing** — orders are `PENDING`. Clover wiring (sandbox) + the pending-order → paid reconciliation + webhooks + payment-recovery job are Phase 3, per the approved architecture.
- **No live shipping** — flat $5.99 / free-over-$50 rule. EasyPost rate shopping + labels + tracking webhooks are Phase 3.
- **No transactional email yet** — password-reset links are logged to the server console in dev; email service is Phase 3.
- **Cart/wishlist for guests** — cart is persistent (cookie); wishlist requires sign-in for persistence (guest gets in-memory + prompt).
- Inventory is deducted at order creation in Phase 2; Phase 3 moves to reserve-at-creation + commit-on-payment per the approved checkout architecture.

Stopping for your review. No checkout payment, shipping, or admin work will begin without approval.
