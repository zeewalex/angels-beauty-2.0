# Angels Beauty — Stage B.1: Provider Integration Readiness Report

**Purpose:** shows what is implemented, what is simulated, what requires credentials, and what remains unverified — BEFORE any external sandbox transactions.
**No live payments, real shipping labels, or production data. No credentials requested in chat.**

---

## Requirements addressed (items 1–10)

| # | Requirement | Status |
|---|---|---|
| 1 | Separate payment-pending notifications from paid-order receipts | ✅ `sendOrderPendingEmail` (at checkout, says "payment pending") + `sendPaymentSuccessReceipt` (only after verified payment). No paid receipt before verification. |
| 2 | Payment reconciliation for timeouts/missing webhooks/delayed payments/expiry | ✅ `releaseExpiredReservations` now calls `checkCloverPaymentStatus` before cancelling — if the provider says "paid", the order is confirmed instead of cancelled. |
| 3 | Secure idempotent refunds with authorization, partial-refund, amount limits, audit, inventory restocking | ⚠️ **Designed, not yet implemented.** Needs a `/api/admin/orders/[id]/refund` endpoint. See §Refunds below. |
| 4 | Validate Clover API against actual sandbox | ⚠️ **Code written against Clover REST patterns; NOT verified against the real sandbox API.** See §Clover. |
| 5 | Validate EasyPost API requests, test-mode rates, tracking | ⚠️ **Code written against EasyPost API patterns; NOT verified against the real test API.** See §EasyPost. |
| 6 | Select/confirm email provider + verify test delivery | ⚠️ **Provider not yet selected.** Templates + idempotency work in console mode. See §Email. |
| 7 | All financial amounts use integer minor units | ✅ Verified: all amounts are `*Cents Int` in the schema + DB; checkout, promotions, shipping, tax, payment, and coupon calculations all use integer cents. No floating-point money. |
| 8 | Automated tests for webhook retries, duplicate events, timeout recovery, races, failed/partial refunds | ⚠️ **Existing: 23/23 regression tests** (idempotency, stock limit, race, unauthorized, ownership, reset tokens, archival, image preservation, payment-status rejection). **Remaining:** webhook-retry/duplicate-event tests, timeout-recovery tests, refund tests — to be written after sandbox verification. |
| 9 | Dev fallbacks cannot activate in production | ✅ `requireCloverCreds()`, `requireEasyPostCreds()`, `requireEmailCreds()` throw explicit errors in production when credentials are missing. |
| 10 | Preserve homepage, 72 products, 11 categories, Cloudinary images | ✅ No changes to any of these. |

---

## Clover — payment integration

### What is implemented
- `src/lib/clover.ts`:
  - `createCloverCharge(amountCents, idempotencyKey, cardToken)` — creates a charge **outside any DB transaction**; uses `Idempotency-Key` header.
  - `createCloverRefund(providerPaymentId, amountCents, idempotencyKey)` — refund call.
  - `checkCloverPaymentStatus(providerPaymentId)` — queries the charge status for reconciliation.
  - `verifyCloverWebhook(body, signature)` — signature verification (HMAC-SHA256 pattern).
- `POST /api/webhooks/clover` — signature-verified, idempotent (`WebhookEvent.externalId`), handles `payment.succeeded` / `payment.failed`.
- Payment lifecycle: PENDING → charge (outside tx) → webhook → COMMIT (success) or RELEASE (failure). Race-safe conditional updates.

### What is simulated (dev fallback)
- When `CLOVER_API_KEY` / `CLOVER_MERCHANT_ID` are absent (dev): `createCloverCharge` returns a simulated success; `checkCloverPaymentStatus` returns "unknown" (expiry proceeds). The `simulate-payment` endpoint drives the lifecycle.
- In **production**: missing creds → explicit `Error` thrown (no silent fallback).

### What requires credentials (set via environment variables — never in chat/code/git)
| Variable | Purpose |
|---|---|
| `CLOVER_API_KEY` | Sandbox API key (from the Clover developer dashboard) |
| `CLOVER_MERCHANT_ID` | Sandbox merchant ID |
| `CLOVER_BASE_URL` | Sandbox API base URL (e.g. `https://sandbox.dev.clover.com`) |
| `CLOVER_WEBHOOK_SIG` | Webhook signing secret (from the webhook registration) |

**How to enter secrets securely:**
1. Obtain sandbox credentials from the Clover developer dashboard (https://docs.clover.com/docs/developer-dashboard).
2. Add them to the `.env` file in the project root (this file is gitignored and never committed).
3. In production (Vercel): add them as environment variables in the Vercel project settings (Settings → Environment Variables). Never hardcode in source.

### What remains unverified (requires sandbox credentials)
- **Clover hosted payment fields:** the current code expects a `cardToken` from Clover's iframe/hosted fields. The exact integration (Clover iframe SDK vs API tokenization) needs verification against the Clover sandbox.
- **API endpoints:** the charge endpoint (`/v1/charges`) and refund endpoint (`/v1/charges/{id}/refunds`) are written against common Clover REST patterns. The **actual Clover Commerce API endpoints, authentication header format, and request/response schema** must be verified against the Clover API documentation for the specific merchant integration.
- **Webhook verification:** the HMAC-SHA256 signature method needs to match Clover's actual webhook verification spec.
- **Idempotency behavior:** whether Clover's API natively supports `Idempotency-Key` headers or uses a different mechanism.
- **Refund flow:** partial refunds, amount limits, and refund webhook events.

### Action required from you
1. Confirm the **Clover API integration method** your existing merchant uses (e.g., Clover Commerce API / e-commerce API / iframe). The implementation must match the actual supported flow.
2. Provide sandbox credentials via `.env` (locally) / Vercel env vars (production).
3. Register a webhook endpoint URL in the Clover sandbox dashboard pointing to `https://<your-domain>/api/webhooks/clover`.

---

## EasyPost — shipping integration

### What is implemented
- `src/lib/easypost.ts`:
  - `validateAddress(addr)` — calls EasyPost `/v2/addresses/verify`.
  - `getShippingRates(subtotalCents, weightOz, toAddress)` — retrieves rates (or flat-rate fallback).
  - `createTestShipment(toAddress, orderId)` — creates a test tracker (no real label).
- `POST /api/webhooks/easypost` — idempotent tracker updates + shipping notification email.

### What is simulated (dev fallback)
- When `EASYPOST_API_KEY` is absent: flat-rate shipping ($5.99 / free over $50); address validation accepts all; test tracker is a generated ID.
- In **production**: missing key → explicit `Error`.

### What requires credentials
| Variable | Purpose |
|---|---|
| `EASYPOST_API_KEY` | EasyPost TEST API key (starts with `ez_`; from https://easypost.com dashboard) |

**How to enter:** add to `.env` (local) / Vercel env vars (production). Use ONLY the test key (`ez_...`); never the production key until approved.

### What remains unverified
- **Rate retrieval:** the actual EasyPost Shipment creation + rate response schema.
- **Address verification:** the response format for verified/failed addresses.
- **Tracker webhook:** the exact event types and payload structure EasyPost sends.
- **Label purchase safeguard:** the code does NOT purchase labels (test mode only); the safeguard needs verification against EasyPost's test-mode label API.

### Action required
1. Create an EasyPost account (if not existing) → get the TEST API key.
2. Add `EASYPOST_API_KEY=ez_...` to `.env`.
3. Register the webhook endpoint in EasyPost dashboard → `https://<domain>/api/webhooks/easypost`.

---

## Email — transactional notifications

### What is implemented
- `src/lib/email.ts`:
  - `sendEmail(params)` — idempotent (idempotencyKey prevents duplicates).
  - Templates: `sendOrderPendingEmail`, `sendPaymentSuccessReceipt`, `sendPaymentFailureEmail`, `sendShippingNotificationEmail`, `sendPasswordResetEmail`.
  - Provider abstraction: `console` (dev) or a provider API call.

### What is simulated (dev fallback)
- `EMAIL_PROVIDER=console` (default): emails are logged to the server console. No real messages sent.
- In **production**: `console` provider → explicit `Error`.

### What requires credentials + a provider decision
| Variable | Purpose |
|---|---|
| `EMAIL_PROVIDER` | Provider key: `resend`, `sendgrid`, `postmark`, etc. |
| `EMAIL_FROM` | From address (e.g. `noreply@angelsbeauties.shop`) |
| `EMAIL_API_KEY` | Provider API key |

**Recommended provider:** Resend (simple API, good Next.js integration, free tier). Alternatively: SendGrid, Postmark, or the existing configured service if one exists.

**How to enter:** create a provider account → get API key → add `EMAIL_PROVIDER`, `EMAIL_FROM`, `EMAIL_API_KEY` to `.env` / Vercel env vars.

### What remains unverified
- Actual test delivery (sending a real email to a test address).
- Provider-specific API call implementation (the `sendViaProvider` function needs the chosen provider's SDK/fetch call).
- Email rendering (HTML templates are basic — may need design refinement).

### Action required
1. **Select an email provider** (recommend Resend unless an existing service is configured).
2. Provide the provider + API key via `.env`.
3. Confirm a "from" address (`EMAIL_FROM`).

---

## Refunds (item 3 — designed, not yet implemented)

**Design:**
- `POST /api/admin/orders/[id]/refund` — admin-only (`requireRole("ADMIN")` + `checkOrigin` CSRF).
- Accepts `{ amountCents, restockInventory: boolean }`.
- Validates: order must be `PAID`; `amountCents` ≤ paid amount (partial refund support); refund idempotencyKey.
- Calls `createCloverRefund(providerPaymentId, amountCents, idempotencyKey)`.
- On success: update Payment status (`PARTIALLY_PAID` or `REFUNDED`); if `restockInventory`, increment inventory `quantity`; audit log.
- On failure: return error; no state change.

**Status:** the refund API call (`createCloverRefund`) is implemented; the admin endpoint + validation + inventory restocking logic is designed but not yet coded. Will be implemented after the Clover sandbox API is verified.

---

## Financial amount verification (item 7) ✅

All amounts use **integer minor units (cents)** throughout:
- DB schema: `priceCents Int`, `subtotalCents Int`, `shippingCents Int`, `taxCents Int`, `discountCents Int`, `totalCents Int`, `amountCents Int` (Payment), `lineCents Int` (OrderItem).
- Checkout: subtotal = Σ(unitCents × qty) from DB; discount = integer cents; shipping = integer cents; total = subtotal − discount + shipping + tax (all integer).
- Payment: `amountCents` = `totalCents` (exact match).
- Coupon: `discountCents` = integer calculation (percentage rounds via `Math.round`).
- No floating-point money anywhere in the calculation or storage.

---

## Test results (current)
| Suite | Result |
|---|---|
| Phase 2 (idempotency, stock, race, unauthorized, ownership, reset, pending-not-paid) | **12/12 ✓** |
| Admin (unauthorized, cross-user, image preservation, inventory, archival, audit, payment-status) | **11/11 ✓** |
| ESLint | **0 errors ✓** |

**Remaining tests to write (after sandbox verification):** webhook retries, duplicate webhook events, payment timeout recovery, payment-vs-expiry race with real provider, failed refunds, partial refunds.

---

## Summary: what needs your action before sandbox verification

1. **Clover:** confirm the API integration method + provide sandbox creds via `.env`.
2. **EasyPost:** provide test API key via `.env`.
3. **Email:** select a provider + provide API key via `.env`.
4. **Webhook URLs:** register `https://<domain>/api/webhooks/clover` and `/api/webhooks/easypost` in the respective dashboards.

**Do NOT provide credentials in chat.** Add them to the `.env` file (gitignored) or Vercel environment variables.

---

## Stopping for review

Per your instruction, I am stopping here before initiating any external sandbox transactions. No live payments, real shipping labels, or production data. The approved homepage, 72 products, 11 categories, and Cloudinary image references are preserved. Awaiting your decisions on the provider configurations above.
