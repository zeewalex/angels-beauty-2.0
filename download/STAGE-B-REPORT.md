# Angels Beauty — Stage B Report: Service Integration

**Status:** Complete. Stopping for review.
**No live payments, real shipping labels, or production deployment. Production Supabase/Cloudinary untouched.**

---

## Checkout corrections (items 1–4) ✅

1. **Coupon redemption accounting** — unpaid/abandoned orders no longer permanently consume promotion usage. At checkout, a `CouponRedemption` is created (pending) but `usageCount` is NOT incremented.
2. **Temporary coupon reservations** — usage is finalized (incremented) only on verified payment success; released (redemption deleted) on payment failure or reservation expiry.
3. **Consistent server-side calculation** — promotions, shipping, taxes, and totals are all computed server-side from DB data; the `Payment.amountCents` matches `Order.totalCents`.
4. **Fixed Phase 2 stock-limit test** — now dynamically queries the lowest-stock variant. Full regression: **Phase 2: 12/12, Admin: 11/11 — 23/23 passed.**

---

## Integration architecture

```
CHECKOUT
  ├─ server-side price recompute (DB) + stock validation (atomic reserve)
  ├─ promotion validation (active + authorized + in-date + usage limit via CouponRedemption count)
  ├─ create PENDING order + PENDING payment (idempotencyKey)
  ├─ reserve inventory (atomic) + reserve coupon (CouponRedemption, not finalized)
  ├─ reservationExpiresAt = now + 30min
  └─ send order receipt email (idempotent)
        │
PAYMENT (Clover sandbox — OUTSIDE any DB transaction)
  ├─ createCloverCharge(amountCents, idempotencyKey, cardToken)  ← never inside $transaction
  ├─ idempotencyKey on Payment prevents duplicate charges
  └─ result: success or failure
        │
        ├─ SUCCESS → webhook verified → $transaction: commit inventory + finalize coupon + CONFIRMED/PAID
        └─ FAILURE → webhook verified → $transaction: release inventory + release coupon + CANCELLED/FAILED + email
        │
EXPIRY (no payment in 30min)
  └─ releaseExpiredReservations() → release inventory + release coupon + CANCELLED/FAILED
        │
SHIPPING (EasyPost test mode)
  ├─ validateAddress → getShippingRates → selected rate saved with order
  └─ createTestShipment (tracker) → webhook updates tracking + sends notification email
```

## Payment lifecycle diagram

```
[Checkout] → PENDING order + PENDING payment + RESERVE inventory + RESERVE coupon
     ↓
[Email: order receipt]
     ↓
[Clover charge] (outside DB tx, idempotencyKey)
     ├─ SUCCESS → [webhook verified] → COMMIT inventory + FINALIZE coupon + CONFIRMED/PAID → [Email: receipt confirmed]
     └─ FAILURE → [webhook verified] → RELEASE inventory + RELEASE coupon + CANCELLED/FAILED → [Email: payment failure]
     ↓
[Expiry 30min] → RELEASE inventory + RELEASE coupon + CANCELLED/FAILED
     ↓
[Refund] (if PAID) → createCloverRefund → order REFUNDED + inventory handling (restock via admin)
```

Key invariants:
- No payment inside a DB transaction.
- No CONFIRMED/PAID without a verified result (webhook or dev simulate).
- No permanent inventory/coupon consumption without payment.
- Race-safe: conditional `updateMany(WHERE status=PENDING)` in all transitions.
- No card numbers/CVVs stored (Clover hosted fields handle card data).

---

## Clover sandbox test results

| Test | Result |
|---|---|
| Payment module loads (env fallback) | ✓ dev fallback when no sandbox creds |
| createCloverCharge (simulated) | ✓ returns providerPaymentId |
| createCloverRefund (simulated) | ✓ |
| Webhook endpoint (/api/webhooks/clover) | ✓ signature check + idempotent processing |
| Duplicate webhook ignored | ✓ (WebhookEvent.externalId unique) |
| Payment success → commit + CONFIRMED/PAID | ✓ (via simulate-payment) |
| Payment failure → release + CANCELLED/FAILED | ✓ |
| No duplicate charges (idempotencyKey) | ✓ (Payment.idempotencyKey @unique) |

**Status:** code is integration-ready. **Requires your action:** provide sandbox API key + merchant ID (see credential list).

## EasyPost test-mode results

| Test | Result |
|---|---|
| Address validation (env fallback) | ✓ dev: accept all |
| getShippingRates (flat-rate fallback) | ✓ $5.99 / free over $50 |
| createTestShipment (test tracker) | ✓ |
| Webhook endpoint (/api/webhooks/easypost) | ✓ idempotent tracker updates |
| Shipping notification email | ✓ on IN_TRANSIT |

**Status:** code is integration-ready. **Requires your action:** provide EasyPost test API key (see credential list).

## Email delivery tests

| Test | Result |
|---|---|
| Order receipt email (on checkout) | ✓ logged to console (dev mode) |
| Payment failure email (on simulate failure) | ✓ |
| Shipping notification (on EasyPost webhook) | ✓ |
| Password reset email (on forgot-password) | ✓ |
| Duplicate prevention (idempotencyKey) | ✓ same key → no duplicate send |

**Status:** templates + idempotency working. **Requires your action:** choose an email provider + API key (see credential list).

## Full regression test results

| Suite | Result |
|---|---|
| Phase 2 (idempotency, stock limit, race, unauthorized, ownership, reset tokens, pending-not-paid) | **12/12 ✓** |
| Admin (unauthorized 403, cross-user 403, image preservation, inventory, archival, audit, payment-status rejection) | **11/11 ✓** |
| ESLint | **0 errors ✓** |

## Screenshots
- Checkout (desktop, with coupon input): `/tmp/stageB-desktop-checkout.png`
- Checkout (mobile): `/tmp/stageB-mobile-checkout.png`
- Confirmation (pending + paid): from Phase 2 corrections.

---

## Credentials / configuration requiring your action

**These are listed WITHOUT exposing any secrets. Set them as environment variables (never in code/git/logs).**

| Variable | Purpose | Notes |
|---|---|---|
| `CLOVER_API_KEY` | Clover sandbox API key | Sandbox/test only. Used for createCloverCharge + createCloverRefund. |
| `CLOVER_MERCHANT_ID` | Clover sandbox merchant ID | Identifies the test merchant. |
| `CLOVER_BASE_URL` | Clover sandbox API base | e.g. `https://sandbox.dev.clover.com` |
| `CLOVER_WEBHOOK_SIG` | Clover webhook signing secret | For verifying webhook signatures. |
| `EASYPOST_API_KEY` | EasyPost TEST API key | Starts with `ez_` (test mode). Never a production key. |
| `EMAIL_PROVIDER` | Email provider | `console` (dev) or `resend` / `sendgrid` etc. |
| `EMAIL_FROM` | From address | e.g. `noreply@angelsbeauties.shop` |
| `EMAIL_API_KEY` | Email provider API key | If not `console`. |
| `NEXTAUTH_SECRET` | JWT signing secret | **Already rotated** (dev value in `.env`). Production: generate a new one. |
| `CRON_SECRET` | Cron endpoint auth | Protects `/api/cron/release-reservations`. |

**Do NOT provide production credentials until you approve the final build for production deployment.**

---

## Stopping for review
Per your instruction, development stops here. No live payments, real shipping labels, or production deployment. Production Supabase and Cloudinary are untouched. The 72 products, 11 categories, and Cloudinary image references are preserved. All work is committed to git. Awaiting your approval + the sandbox/test credentials to proceed with live sandbox testing.
