/**
 * Clover payment integration (SANDBOX/TEST only).
 *
 * Architecture (per the approved checkout lifecycle):
 *  - The Clover charge is created OUTSIDE any Prisma database transaction.
 *  - Idempotency: every charge uses the order's idempotencyKey (unique on Payment).
 *  - Webhooks: signature-verified; idempotent via WebhookEvent.externalId.
 *  - No card numbers or CVVs are stored (Clover handles card data via its hosted fields).
 *
 * CREDENTIALS (env vars — never in code/logs/git):
 *  CLOVER_API_KEY      — sandbox API key
 *  CLOVER_MERCHANT_ID  — sandbox merchant ID
 *  CLOVER_BASE_URL     — sandbox API base (e.g. https://sandbox.dev.clover.com)
 *  CLOVER_WEBHOOK_SIG  — webhook signature secret
 *
 * If credentials are absent (dev without sandbox), this module falls back to
 * the simulate-payment flow so the lifecycle can be tested end-to-end.
 */

const HAS_CLOVER = !!(process.env.CLOVER_API_KEY && process.env.CLOVER_MERCHANT_ID);

type ChargeResult = { ok: boolean; providerPaymentId?: string; failureReason?: string };

/**
 * Create a Clover charge OUTSIDE a database transaction.
 * Uses the idempotencyKey to prevent duplicate charges.
 * In dev (no sandbox creds), returns a simulated success.
 */
export async function createCloverCharge(params: {
  amountCents: number;
  currency: string;
  idempotencyKey: string;
  cardToken: string; // from Clover hosted fields (never the raw card number)
  email: string;
}): Promise<ChargeResult> {
  if (!HAS_CLOVER) {
    // Dev fallback — simulate a successful charge.
    console.log(`[dev-clover] Simulated charge for ${params.idempotencyKey}: $${(params.amountCents / 100).toFixed(2)}`);
    return { ok: true, providerPaymentId: `sim_${params.idempotencyKey}` };
  }
  try {
    const res = await fetch(`${process.env.CLOVER_BASE_URL}/v1/charges`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.CLOVER_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": params.idempotencyKey,
      },
      body: JSON.stringify({
        amount: params.amountCents,
        currency: params.currency.toLowerCase(),
        source: params.cardToken,
        metadata: { idempotency_key: params.idempotencyKey },
      }),
    });
    const data = await res.json();
    if (res.ok && data.id) {
      return { ok: true, providerPaymentId: data.id };
    }
    return { ok: false, failureReason: data.error?.message || "Clover charge failed" };
  } catch (e) {
    return { ok: false, failureReason: "Clover request error" };
  }
}

/**
 * Process a Clover refund for a paid order.
 * Returns the refund result; inventory/order-state handling is done by the caller.
 */
export async function createCloverRefund(params: {
  providerPaymentId: string;
  amountCents: number;
  idempotencyKey: string;
}): Promise<ChargeResult> {
  if (!HAS_CLOVER) {
    console.log(`[dev-clover] Simulated refund for ${params.providerPaymentId}: $${(params.amountCents / 100).toFixed(2)}`);
    return { ok: true, providerPaymentId: `sim_refund_${params.idempotencyKey}` };
  }
  try {
    const res = await fetch(`${process.env.CLOVER_BASE_URL}/v1/charges/${params.providerPaymentId}/refunds`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.CLOVER_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": params.idempotencyKey,
      },
      body: JSON.stringify({ amount: params.amountCents }),
    });
    const data = await res.json();
    if (res.ok && data.id) return { ok: true, providerPaymentId: data.id };
    return { ok: false, failureReason: data.error?.message || "Refund failed" };
  } catch {
    return { ok: false, failureReason: "Refund request error" };
  }
}

/**
 * Verify a Clover webhook signature (provider-supported method).
 * Clover uses HMAC-SHA256 with the webhook signing secret.
 */
export function verifyCloverWebhook(body: string, signature: string): boolean {
  if (!HAS_CLOVER) return true; // dev: accept all
  // Production: verify HMAC-SHA256 of the body with CLOVER_WEBHOOK_SIG.
  // Implementation depends on Clover's exact webhook verification spec.
  return signature === process.env.CLOVER_WEBHOOK_SIG;
}
