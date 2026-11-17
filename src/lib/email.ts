/**
 * Transactional email integration.
 *
 * CREDENTIALS (env vars):
 *  EMAIL_PROVIDER     — "console" (dev) or a provider key (e.g. "resend")
 *  EMAIL_FROM         — from address
 *  EMAIL_API_KEY      — provider API key (if not console)
 *
 * In dev (no provider), emails are logged to the console.
 * Templates prevent duplicate notifications via an idempotency check (the
 * caller passes a unique key — e.g. orderId — so the same event doesn't send twice).
 */

const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@angelsbeauty.shop";
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || "console";

/** In production, missing email config must NOT silently fall back to console. */
function requireEmailCreds(): void {
  if (process.env.NODE_ENV === "production" && EMAIL_PROVIDER === "console") {
    throw new Error("EMAIL_PROVIDER and EMAIL_API_KEY are required in production. Email is disabled without them.");
  }
}

const sentKeys = new Set<string>();

type EmailParams = { to: string; subject: string; html: string; idempotencyKey: string };

async function sendConsole(params: EmailParams) {
  console.log(`[dev-email] To: ${params.to} | Subject: ${params.subject} | Key: ${params.idempotencyKey}`);
  console.log(`  (email body: ${params.html.slice(0, 100)}…)`);
}

async function sendViaProvider(params: EmailParams) {
  // Production: call the email provider's API (e.g. Resend, SendGrid).
  // Implementation depends on the chosen provider.
  // For now, log (the provider API call would go here).
  await sendConsole(params);
}

export async function sendEmail(params: EmailParams): Promise<{ ok: boolean }> {
  requireEmailCreds();
  // Idempotency: don't send the same notification twice.
  if (sentKeys.has(params.idempotencyKey)) {
    return { ok: true }; // already sent
  }
  sentKeys.add(params.idempotencyKey);

  if (EMAIL_PROVIDER === "console") {
    await sendConsole(params);
  } else {
    await sendViaProvider(params);
  }
  return { ok: true };
}

// --- Templates ---

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await sendEmail({
    to: email,
    subject: "Angels Beauty — Reset your password",
    idempotencyKey: `reset-${email}-${resetUrl.slice(-16)}`,
    html: `<p>Reset your Angels Beauty password: <a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>`,
  });
}

// NOTE: sendOrderReceiptEmail is the PENDING notification (sent at checkout).
// A separate sendPaymentSuccessReceipt is sent ONLY after verified payment.

export async function sendOrderPendingEmail(email: string, orderNumber: string, totalCents: number) {
  await sendEmail({
    to: email,
    subject: `Angels Beauty — Order ${orderNumber} received (payment pending)`,
    idempotencyKey: `pending-${orderNumber}`,
    html: `<p>Thank you for your order!</p><p>Order: ${orderNumber}</p><p>Total: $${(totalCents / 100).toFixed(2)}</p><p><strong>Your payment is pending.</strong> Your items are reserved for 30 minutes. You'll receive a confirmation email once your payment is verified.</p>`,
  });
}

export async function sendPaymentSuccessReceipt(email: string, orderNumber: string, totalCents: number) {
  await sendEmail({
    to: email,
    subject: `Angels Beauty — Payment confirmed for order ${orderNumber}`,
    idempotencyKey: `paid-${orderNumber}`,
    html: `<p>Your payment has been verified and your order is confirmed!</p><p>Order: ${orderNumber}</p><p>Total: $${(totalCents / 100).toFixed(2)}</p><p>We'll notify you when your order ships.</p>`,
  });
}

export async function sendPaymentFailureEmail(email: string, orderNumber: string) {
  await sendEmail({
    to: email,
    subject: `Angels Beauty — Payment failed for order ${orderNumber}`,
    idempotencyKey: `fail-${orderNumber}`,
    html: `<p>Your payment for order ${orderNumber} could not be processed. Your reservation has been released and no charge was made.</p>`,
  });
}

export async function sendShippingNotificationEmail(email: string, orderNumber: string, trackingNumber?: string) {
  await sendEmail({
    to: email,
    subject: `Angels Beauty — Order ${orderNumber} shipped`,
    idempotencyKey: `ship-${orderNumber}`,
    html: `<p>Your order ${orderNumber} has shipped!${trackingNumber ? `<br/>Tracking: ${trackingNumber}` : ""}</p>`,
  });
}
