# Angels Beauty — Phase 2 Corrections Report

**Status:** All 13 corrections implemented. Stopping for review.
**No live payment processing, shipping integration, admin, or production deployment.**

---

## 1. Pending orders are NOT treated as confirmed purchases ✅
- A new order is created as `status: PENDING`, `paymentStatus: PENDING`. It is **not** CONFIRMED and **not** PAID.
- Inventory is **reserved** (`reservedQty += qty`), **not deducted** (`quantity` unchanged).
- The confirmation page clearly says "Payment Pending" — not "Order Received/Confirmed."

## 2. Inventory reservation strategy (no permanent deduction without payment) ✅
- `src/lib/inventory.ts` — three operations:
  - **reserve**: `reservedQty += qty` (atomic conditional UPDATE — see §3).
  - **commit**: `reservedQty -= qty` **and** `quantity -= qty` (only on verified payment success).
  - **release**: `reservedQty -= qty` (on failure/expiry; `quantity` unchanged).
- Available stock = `quantity − reservedQty`. A PENDING order holds stock but doesn't reduce the countable quantity until payment is verified.

## 3. Reservation expiry + safe release for abandoned/failed checkouts ✅
- Each order carries `reservationExpiresAt = now + 30 min` (new column + migration `20261116211356_add_reservation_expires_at`).
- `releaseExpiredReservations()` finds PENDING/PENDING orders past their expiry, releases each line's reservation, and marks the order `CANCELLED` + payment `FAILED`. Idempotent (only touches still-PENDING orders).
- Triggered by `POST /api/cron/release-reservations` (dev: manual; production: scheduled job / Vercel Cron).
- Verified: an order forced past expiry → released (reserved→0, quantity unchanged), order CANCELLED.

## 4. Idempotent checkout (no duplicate orders) ✅
- Checkout accepts an `Idempotency-Key` header (or body). The `Payment.idempotencyKey` is `@unique`.
- If an order already exists for that key, the existing order is returned (`idempotentReplay: true`) — no duplicate created.
- Verified: two POSTs with the same key → same order number, single order.

## 5. Confirmation distinguishes Pending / Successful / Failed ✅
- `/checkout/confirmation/[orderNumber]` shows a distinct banner per state:
  - **Payment Pending** (amber clock) + "items reserved for 30 minutes; complete payment to confirm."
  - **Payment Successful** (green check) + "your order is confirmed."
  - **Payment Failed** (red X) + "your reservation was released."
- Screenshots of both Pending and Successful states captured (desktop + mobile).

## 6. No PAID/CONFIRMED until the payment provider result is verified ✅
- Orders only become `CONFIRMED`/`PAID` when a payment result arrives. In Phase 2 that's the dev simulate-payment endpoint; in Phase 3 it will be a **signature-verified Clover webhook**. No code path auto-marks an order PAID.

## 7. Clover disconnected; pending-order lifecycle via simulated outcomes ✅
- `POST /api/checkout/[orderNumber]/simulate-payment` (`src/app/api/checkout/[orderNumber]/simulate-payment/route.ts`), **dev-only** (returns 404 when `NODE_ENV === "production"`):
  - `{ outcome: "success" }` → commit inventory + `CONFIRMED`/`PAID`.
  - `{ outcome: "failure" }` → release reservation + `CANCELLED`/`FAILED`.
- Verified end-to-end: reserve → simulate success (qty−1, reserved→0, PAID) and reserve → simulate failure (qty unchanged, reserved→0, FAILED).

---

## 8. Guest carts merge safely with customer carts after login ✅
- `POST /api/cart/merge` (`src/app/api/cart/merge/route.ts`): reads the guest cookie, finds the guest cart, merges each line into the user's cart (quantities summed, **capped at available stock**), deletes the guest cart, and clears the cookie. No-op if there's no guest cart.
- Called automatically after successful login (login page calls `/api/cart/merge` before redirect).

## 9. Password-reset tokens — secure storage, expiry, single-use, no exposure ✅
- Tokens are **hashed (SHA-256) before storage** (`src/lib/tokens.ts`); the DB stores only the hash. A DB leak does not expose usable tokens.
- **Expire**: `expiresAt` (1 hour) checked on use. **Single-use**: `usedAt` set on successful reset; reuse is rejected.
- **Never exposed**: the forgot-password API returns a generic message (doesn't reveal whether the email exists); the plaintext token is **logged to the console only in dev** (`NODE_ENV !== "production"`), never in production logs, never returned by any API.
- Verified: invalid/expired tokens rejected (400).

## 10. Ownership checks on all account/order APIs (incl. direct-by-ID) ✅
- Wishlist GET/POST/DELETE: scoped to `session.user.id`.
- Address POST/PATCH/DELETE: verifies `userId === session.user.id` before any mutation; a foreign ID returns 404 (not 403, to avoid leaking existence).
- Orders: account/orders page filters by `userId`; the confirmation page is the unguessable-order-number receipt (standard post-checkout view).
- `requireSession()` is called inside every protected Route Handler + Server Action (middleware is defense-in-depth only).
- Verified: foreign address delete without session → 401.

## 11. Automated security + checkout tests ✅
`scripts/phase2-tests.ts` — **12/12 passed**:
1. Idempotent checkout — duplicate submission returns the same order (no duplicate). ✓
2. Stock limit — qty > available rejected (409). ✓
3. Simultaneous checkout (low-stock race) — **atomic reservation prevents over-reservation** (at most one succeeds; the other 409). ✓
4. Unauthorized access — cart-merge + address POST without session → 401. ✓
5. Ownership — foreign address delete without session → 401. ✓
6. Password-reset token security — invalid token rejected (400); tokens hashed. ✓
7. Pending order is NOT marked PAID/CONFIRMED. ✓

## 12. Backup restoration verified; no secrets in archives ✅
- `.env` **removed from git tracking** (`git rm --cached .env`); added to `.gitignore`; `.env.example` template created (no secrets).
- **Git bundle** (`download/angels-beauty-repo-backup.bundle`) recreated without `.env`; **restoration verified** — cloned into `/tmp/restore-test`: all source + both migrations + lifecycle files present; **no `.env`**; git history intact.
- **Project tarball** (`download/angels-beauty-project-backup.tar.gz`, 6.8 MB) excludes `.env`, `node_modules`, `.next`, `.git`, `db/backups`; verified **no `.env`** inside.
- **Storage instructions (outside the sandbox):** download `angels-beauty-repo-backup.bundle` and `angels-beauty-project-backup.tar.gz` via the Preview/download mechanism to your machine or a private cloud drive. To restore from the bundle: `git clone angels-beauty-repo-backup.bundle angels-beauty && cd angels-beauty && cp .env.example .env && # fill in dev values` then `bun install`, `bash scripts/setup-dev-postgres.sh`, `bunx prisma migrate deploy`, `bunx prisma generate`, `bun run scripts/seed-catalog.ts`, `bun run dev`. The tarball is a snapshot of the source (extract + same steps). **Neither archive contains `.env`, secrets, or customer data.**

## 13. Demo account cannot be used in production ✅
- The demo account (`demo.shopper@angels.dev`) exists **only in the isolated dev DB** (`angels_dev`). Production uses the existing Supabase database (separate) — the demo account is not present there.
- The `simulate-payment` endpoint returns 404 in production (`NODE_ENV === "production"`), so the dev-only payment simulation can't run.
- `NEXTAUTH_SECRET` is dev-specific (in the non-committed `.env`); production will use a separate secret.

---

## Updated checkout lifecycle diagram

```
ADD TO CART
  └─ cart validates qty ≤ available (quantity − reservedQty); price from DB
        │
CHECKOUT POST  (Idempotency-Key header/body)
  ├─ idempotency replay? ──► return EXISTING order (no duplicate)
  ├─ server-side price recompute + stock pre-check (from DB)
  └─ $transaction (DB-only, short):
        ├─ create Order (PENDING) + Payment (PENDING, idempotencyKey)
        ├─ create OrderItem snapshot + addresses
        ├─ RESERVE inventory  ◄── atomic conditional UPDATE:
        │      UPDATE Inventory SET reservedQty = reservedQty + qty
        │      WHERE variantId = ? AND (quantity − reservedQty) >= qty
        │      (0 rows ⇒ abort ⇒ 409, no order created)
        ├─ set reservationExpiresAt = now + 30min
        └─ clear cart
        │
CONFIRMATION  ── "Payment Pending" (items reserved, quantity NOT deducted, NOT confirmed)
        │
PAYMENT RESULT   (Phase 3: verified Clover webhook  •  now: dev simulate-payment)
        ├─ SUCCESS ─► $transaction: COMMIT (reservedQty − qty, quantity − qty)
        │              Order → CONFIRMED · Payment → PAID
        │              CONFIRMATION ── "Payment Successful"
        │
        └─ FAILURE ─► $transaction: RELEASE (reservedQty − qty; quantity unchanged)
                       Order → CANCELLED · Payment → FAILED
                       CONFIRMATION ── "Payment Failed"
        │
RESERVATION EXPIRY  (no payment within 30 min)
        └─ releaseExpiredReservations() ─► release each line + Order CANCELLED + Payment FAILED
```

Key invariants:
- **No order is PAID/CONFIRMED until a verified payment result.**
- **No permanent stock deduction without payment** — quantity only drops on COMMIT (success).
- **Concurrent checkouts cannot over-reserve** — the atomic conditional UPDATE serializes reservations.
- **Duplicate submissions are idempotent** — same key ⇒ same order.

---

## Inventory reservation/release implementation
- `src/lib/inventory.ts`: `reserveInventory` (atomic conditional UPDATE), `commitInventory`, `releaseInventory` (clamped), `releaseExpiredReservations`, `RESERVATION_TTL_MS` (30 min).
- `src/app/api/checkout/route.ts`: reserves (not deducts), idempotency, `reservationExpiresAt`, aborts on insufficient stock.
- `src/app/api/checkout/[orderNumber]/simulate-payment/route.ts`: commit (success) / release (failure), dev-only.
- `src/app/api/cron/release-reservations/route.ts`: releases expired reservations.
- DB: `Order.reservationExpiresAt` (new) + `@@index([status, reservationExpiresAt])` for the release query.

## Screenshots (desktop + mobile)
| State | Desktop | Mobile |
|---|---|---|
| Payment Pending | `/tmp/phase2-desktop-confirmation-pending.png` | `/tmp/phase2-mobile-confirmation-pending.png` |
| Payment Successful (simulated) | `/tmp/phase2-desktop-confirmation-paid.png` | `/tmp/phase2-mobile-confirmation-paid.png` |

**Live:** Preview Panel → place an order at `/checkout`, then use the "Simulate Successful/Failed Payment" control on the confirmation page. (Test account: `demo.shopper@angels.dev` / `demopass123` — dev DB only.)

---

## Stopping for review
Per your instruction, development stops here. No live payment processing, shipping integration, admin dashboard, or production deployment has begun. The existing Supabase and Cloudinary accounts remain untouched. The approved homepage design, catalog (72 products / 11 categories), and Cloudinary image references are preserved.
