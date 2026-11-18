# Angels Beauty — Provider Compatibility & Payment Safety Review

**Purpose:** final review before requesting sandbox credentials or performing external transactions.
**No credentials requested or exposed. No sandbox transactions. No production data modified.**

---

## Original integration search

The original Angels Beauty development project was **deleted** before this rebuild began. A thorough search of the current codebase found:

- **No original Clover integration code, config, or documentation.**
- **No original EasyPost integration code or config.**
- **No original email provider configuration** (no resend/sendgrid/postmark/mailgun in package.json).
- **No `.env` with provider credentials** (the only `.env` was the SQLite dev DB URL).

**Conclusion:** nothing from the original website's payment/shipping/email integrations can be reused. The catalog data (72-product CSV export) is the only original asset in use.

---

## What can be reused from the original website

| Asset | Reusable? |
|---|---|
| 72-product catalog (CSV) | ✅ In use as `src/lib/catalog.ts` + dev DB seed |
| Cloudinary image assets (89 URLs) | ✅ Referenced read-only (assets preserved) |
| Supabase product data | ✅ CSV export used for reconciliation (read-only) |
| Original Clover integration | ❌ Deleted — no code/config found |
| Original EasyPost integration | ❌ Deleted — no code/config found |
| Original email provider | ❌ None found |

## What needs new implementation

| Component | Status | What remains |
|---|---|---|
| Clover API calls | Code written against REST patterns | **Must be verified** against the actual Clover merchant's supported API flow (Commerce API vs e-commerce iframe vs tokenization). The exact endpoints, auth header, request/response schema, and webhook signature method must match the real Clover integration. |
| Clover hosted payment fields | Not implemented | Must integrate Clover's iframe/SDK for card tokenization (the code expects a `cardToken` but doesn't render the hosted fields). |
| EasyPost API calls | Code written against API patterns | **Must be verified** against EasyPost's actual test-mode API for address verification, rate retrieval, and tracker events. |
| Email provider API call | `sendViaProvider` is a stub | Must implement the chosen provider's SDK/fetch call (e.g., Resend's `resend.emails.send()`). |
| Refund endpoint | ✅ Implemented this review | `/api/admin/orders/[id]/refund` — admin-only, partial refunds, idempotent, amount-limited, audit-logged, controlled restocking. |

## What is verified

| Item | Verification |
|---|---|
| Payment lifecycle (reserve → commit/release) | ✅ 23/23 tests pass |
| Inventory atomic reservation (no over-commit) | ✅ Race test verifies |
| Coupon reservation lifecycle (finalize on payment, release on failure/expiry) | ✅ |
| Payment reconciliation (check provider before cancelling) | ✅ Code implemented; when Clover is unreachable → retry (not auto-cancel); max 24h hold before forced escalation |
| Pending ≠ paid (no paid receipt before verified payment) | ✅ Separate emails |
| Refunds (idempotent, partial, amount-limited, audit, restock) | ✅ Endpoint implemented |
| Dev fallback guards (production errors on missing creds) | ✅ `requireCloverCreds/EasyPostCreds/EmailCreds` throw |
| Simulation endpoint dev-only | ✅ `process.env.NODE_ENV !== "development"` → 404 (blocks staging + production) |
| No double-commit (conditional `updateMany WHERE status=PENDING`) | ✅ All transitions are race-safe |
| Integer minor units throughout | ✅ All amounts in cents |
| Git history clean (no `.env`/secrets) | ✅ Verified 0 blobs |
| Homepage/products/categories/images preserved | ✅ No changes |

## What requires provider access

| Provider | What's needed | Cannot verify without |
|---|---|---|
| **Clover** | Sandbox API key, merchant ID, base URL, webhook signing secret | The actual Clover API endpoints, auth format, hosted-fields SDK, webhook signature method |
| **EasyPost** | Test API key (`ez_...`) | The actual test-mode rate/address/tracker API responses |
| **Email** | Provider selection + API key | Actual email delivery |

## Exact actions you must perform

### Clover merchant dashboard
1. Log into the Clover developer dashboard (https://docs.clover.com/docs/developer-dashboard).
2. Create or identify the sandbox app → get the **API key** and **merchant ID**.
3. Confirm the **payment collection method** your merchant uses:
   - Clover Commerce API (server-side charges)?
   - Clover e-commerce iframe (hosted card fields)?
   - Clover tokenization (card token → server charge)?
4. Register a **webhook endpoint**: URL = `https://<your-domain>/api/webhooks/clover`; note the **webhook signing secret**.
5. Confirm the **webhook event types** Clover sends (e.g., `payment.created`, `payment.updated`, `refund.created`).
6. Confirm the **refund API endpoint + behavior** (partial refunds supported? idempotency method?).
7. Add `CLOVER_API_KEY`, `CLOVER_MERCHANT_ID`, `CLOVER_BASE_URL`, `CLOVER_WEBHOOK_SIG` to `.env` (locally) or Vercel env vars (production).

### EasyPost dashboard
1. Create/login to EasyPost (https://easypost.com).
2. Get the **TEST API key** (starts with `ez_`).
3. Register a **webhook endpoint**: URL = `https://<your-domain>/api/webhooks/easypost`; select tracker events.
4. Add `EASYPOST_API_KEY=ez_...` to `.env`.

### Email provider
1. **Select a provider** — recommended: **Resend** (https://resend.com, free tier, simple API).
2. Create an account → get the **API key**.
3. Set the **from address** (e.g., `noreply@angelsbeauties.shop`) — verify the domain in the provider dashboard.
4. Add `EMAIL_PROVIDER=resend`, `EMAIL_FROM=noreply@angelsbeauties.shop`, `EMAIL_API_KEY=re_...` to `.env`.

---

## Payment safety summary

| Scenario | Behavior |
|---|---|
| Payment success + webhook arrives | Webhook verified → commit inventory + finalize coupon + CONFIRMED/PAID |
| Payment failure + webhook arrives | Webhook verified → release inventory + release coupon + CANCELLED/FAILED + email |
| Webhook delayed/missing (payment may have succeeded) | Reconciliation job checks provider state before cancelling. If provider says "paid" → confirm. If "failed" → cancel. |
| Clover unreachable during reconciliation | **DO NOT auto-cancel.** Order stays PENDING; inventory stays reserved. Retried on next cron run. After 24h max hold → forced cancel with escalation log. |
| Payment success vs expiry race | Conditional `updateMany(WHERE status=PENDING)` — first to commit wins; the other is a no-op. No double-commit. |
| Duplicate webhook | `WebhookEvent.externalId` unique — second delivery is ignored. |
| Duplicate checkout submission | `Payment.idempotencyKey` unique — returns existing order. |
| Refund requested twice | `Idempotency-Key` header — returns existing refund. |
| Partial refund | Amount validated ≤ (total − already refunded). Payment → PARTIALLY_PAID. |
| Full refund | Payment → REFUNDED. Order → REFUNDED. Optional inventory restock. |
| Missing creds in production | Explicit `Error` thrown — no silent simulation. |
| Simulation endpoint in staging/prod | 404 (blocked). |

---

## Stopping for review

Per your instruction, I am stopping here. No sandbox transactions initiated, no production data modified, no deployment. The approved homepage, 72 products, 11 categories, and Cloudinary image references are preserved. All code is committed to git (history clean of secrets). Awaiting your provider dashboard actions before proceeding with real sandbox verification.
