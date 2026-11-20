# Angels Beauty — Stage B.1 Report: Sandbox Verification

**Status:** Complete. Stopping for review.
**No live payments, real shipping labels, production data modification, or deployment.**

---

## Production Limitation Recorded

**Hero uploads:** currently stored in `/public/uploads/hero/` (local dev storage). This is acceptable for local development testing only. Production requires durable external storage (Cloudinary). Production Cloudinary has **not** been connected or modified.

---

## Test Results: 40/40 Stage B.1 + 23/23 Regression = 63/63 Total ✅

### Stage B.1 Integration Tests (40/40)

| # | Category | Tests | Result |
|---|---|---|---|
| 1 | Payment Lifecycle | checkout→PENDING, inventory reserved, simulate success→CONFIRMED/PAID, inventory committed, reservation released, DB verified | **6/6 ✓** |
| 2 | Payment Failure | simulate failure→CANCELLED/FAILED, inventory NOT deducted, reservation released, DB verified | **5/5 ✓** |
| 3 | Refunds | full refund succeeds, order→REFUNDED, inventory restocked, duplicate refund rejected (409) | **4/4 ✓** |
| 4 | Webhook Idempotency | duplicate success→already settled, failure after success→no corruption, order stays CONFIRMED/PAID | **4/4 ✓** |
| 5 | Reservation Expiry + Reconciliation | expired order→CANCELLED/FAILED, inventory not deducted, reservation released, cron succeeds | **6/6 ✓** |
| 6 | Cron Security | no secret→401, wrong secret→401 | **2/2 ✓** |
| 7 | EasyPost (Dev Fallback) | fallback active, checkout with flat-rate succeeds, shipping in total | **4/4 ✓** |
| 8 | Email (Console Mode) | console mode active, email logged on checkout | **2/2 ✓** |
| 9 | Track Order Security | valid lookup succeeds, wrong email→404, rate limiting (429) | **3/3 ✓** |
| 10 | Dev Fallback Guards | simulate-payment dev-only, Clover/EasyPost/Email guards in production | **4/4 ✓** |

### Regression (23/23)
| Suite | Result |
|---|---|
| Phase 2 (idempotency, stock, race, unauthorized, ownership, reset, pending) | **12/12 ✓** |
| Admin (unauthorized 403, cross-user, image preservation, inventory, archival, audit, payment-status) | **11/11 ✓** |
| ESLint | **0 errors ✓** |

---

## What Was Verified (Dev Simulation)

These tests exercise the **full payment lifecycle** using the dev simulation endpoints. The logic, state transitions, inventory/coupon reconciliation, race safety, and refund mechanics are all real — only the external provider call is simulated.

| Verified | Evidence |
|---|---|
| Order created PENDING, not CONFIRMED | checkout returns `status: "PENDING"` |
| Inventory reserved (reservedQty+), not deducted (quantity unchanged) | DB query before/after |
| Payment success → commit inventory (quantity−, reservedQty−), CONFIRMED/PAID | DB query + simulate response |
| Payment failure → release reservation (reservedQty−), quantity unchanged, CANCELLED/FAILED | DB query + simulate response |
| Full refund → REFUNDED, inventory restocked, duplicate rejected (409) | API response + DB |
| Duplicate webhook events → idempotent (already settled, no double-commit) | Second success returns `alreadySettled: true` |
| Failure after success → no state corruption | Order stays CONFIRMED/PAID |
| Reservation expiry → CANCELLED/FAILED, inventory released | Forced expiry + cron release |
| Reconciliation: provider status checked before cancelling | Code verified (checkCloverPaymentStatus) |
| Late webhook race → conditional updateMany prevents double-commit | Code verified (WHERE status=PENDING) |
| Cron endpoint auth (x-cron-secret) | 401 without/wrong secret |
| Track order privacy (same error for wrong email + non-existent) | 404 for both |
| Track order rate limiting (5/min per IP) | 429 after exceeding |
| EasyPost flat-rate fallback ($5.99 / free over $50) | checkout total includes shipping |
| Email templates logged to console | dev.log contains [dev-email] entries |
| Dev fallback guards (production errors on missing creds) | Code verified (requireCloverCreds/EasyPostCreds/EmailCreds) |
| Simulate-payment blocked in staging/production | Code verified (NODE_ENV !== "development" → 404) |

---

## What Requires Sandbox Credentials (Not Yet Verified Against Real APIs)

| Provider | What's Needed | What Remains Unverified |
|---|---|---|
| **Clover** | `CLOVER_API_KEY`, `CLOVER_MERCHANT_ID`, `CLOVER_BASE_URL`, `CLOVER_WEBHOOK_SIG` | Real charge creation, actual API endpoints/auth format, hosted payment fields (iframe/SDK), webhook signature verification method, real refund processing |
| **EasyPost** | `EASYPOST_API_KEY` (test, `ez_...`) | Real address verification, actual rate retrieval, test shipment creation, tracker webhook events |
| **Email** | `EMAIL_PROVIDER`, `EMAIL_FROM`, `EMAIL_API_KEY` | Actual email delivery to a real address, provider-specific API call |

### How to Enter Sandbox Credentials Securely

**Do NOT provide credentials in chat.** Add them to the `.env` file (gitignored, never committed) or Vercel environment variables:

```bash
# In .env (local dev) or Vercel Settings → Environment Variables (production)
CLOVER_API_KEY=your_sandbox_key
CLOVER_MERCHANT_ID=your_sandbox_merchant
CLOVER_BASE_URL=https://sandbox.dev.clover.com
CLOVER_WEBHOOK_SIG=your_webhook_signing_secret
EASYPOST_API_KEY=ez_your_test_key
EMAIL_PROVIDER=resend
EMAIL_FROM=noreply@angelsbeauties.shop
EMAIL_API_KEY=re_your_key
```

Once credentials are added, restart the dev server. The integration modules will automatically use the real APIs instead of dev fallbacks (the `require*Creds()` guards pass, `HAS_CLOVER`/`HAS_EASYPOST` become true).

---

## Payment Lifecycle Diagram (Verified)

```
Checkout → PENDING order + RESERVE inventory + RESERVE coupon + email (pending)
  ↓
Payment (Clover charge OUTSIDE DB tx — dev: simulate-payment)
  ├─ SUCCESS → COMMIT inventory + FINALIZE coupon + CONFIRMED/PAID + email (receipt)
  └─ FAILURE → RELEASE inventory + RELEASE coupon + CANCELLED/FAILED + email (failure)
  ↓
Expiry (30min, no payment) → check provider state:
  ├─ Provider says PAID → confirm (don't cancel)
  ├─ Provider says FAILED → cancel + release
  └─ Provider UNREACHABLE → RETRY (don't cancel); after 24h max → forced cancel
  ↓
Refund (admin-only) → createCloverRefund → REFUNDED + optional inventory restock
```

---

## Files Changed
- `src/app/api/checkout/[orderNumber]/simulate-payment/route.ts` — sets `providerPaymentId` on success (enables refunds)
- `scripts/stage-b1-tests.ts` — comprehensive 40-test integration suite

## Confirmation
- Production Supabase: **not modified or connected** ✅
- Production Cloudinary: **not modified or connected** ✅
- Clover/EasyPost/Email: **not connected** (dev simulation only) ✅
- Production domain: **not deployed** ✅
- 72 products, 11 categories, Cloudinary refs: **preserved** ✅

---

## Stopping for review
Stage B.1 is complete with 40/40 integration tests + 23/23 regression tests passing. The payment lifecycle, refund workflow, webhook idempotency, reservation expiry/reconciliation, rate limiting, and dev fallback guards are all verified. Sandbox credentials are needed to verify against real provider APIs. Awaiting your review.
