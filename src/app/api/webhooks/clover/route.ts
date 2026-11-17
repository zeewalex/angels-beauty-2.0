import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyCloverWebhook } from "@/lib/clover";
import { commitInventory, releaseInventory } from "@/lib/inventory";
import { sendPaymentFailureEmail } from "@/lib/email";

/**
 * POST /api/webhooks/clover — verified Clover webhook.
 *
 * Handles payment.succeeded and payment.failed events.
 * - Idempotent: checked via WebhookEvent.externalId.
 * - Signature-verified via verifyCloverWebhook.
 * - Payment success → commit inventory + mark CONFIRMED/PAID.
 * - Payment failure → release reservation + mark CANCELLED/FAILED.
 *
 * This endpoint is PUBLIC (Clover calls it) but verifies the webhook signature.
 */
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-clover-signature") || "";
  if (!verifyCloverWebhook(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);
  const externalId = event.id || `${event.type}-${Date.now()}`;

  // Idempotency: skip if already processed.
  const existing = await db.webhookEvent.findUnique({ where: { provider_externalId: { provider: "clover", externalId } } });
  if (existing?.status === "PROCESSED") {
    return NextResponse.json({ ok: true, alreadyProcessed: true });
  }

  // Record the webhook event.
  const whEvent = await db.webhookEvent.create({
    data: { provider: "clover", eventType: event.type, externalId, signature: signature.slice(0, 64), payload: JSON.parse(body), status: "PROCESSING" },
  });

  try {
    const paymentId = event.data?.object?.id;
    const payment = await db.payment.findFirst({ where: { providerPaymentId: paymentId }, include: { order: { include: { items: true } } } });
    if (!payment || !payment.order) {
      await db.webhookEvent.update({ where: { id: whEvent.id }, data: { status: "PROCESSED" } });
      return NextResponse.json({ ok: true, message: "Payment not found (ignored)" });
    }

    const order = payment.order;
    const now = new Date();

    if (event.type === "payment.succeeded") {
      await db.$transaction(async (tx) => {
        const settled = await tx.order.updateMany({
          where: { id: order.id, status: "PENDING", paymentStatus: "PENDING" },
          data: { status: "CONFIRMED", paymentStatus: "PAID" },
        });
        if (settled.count === 0) return;
        for (const it of order.items) {
          await commitInventory(tx, it.variantId, it.quantity);
        }
        await tx.payment.updateMany({ where: { orderId: order.id, status: "PENDING" }, data: { status: "PAID", processedAt: now } });
        // Finalize coupon usage.
        const redemptions = await tx.couponRedemption.findMany({ where: { orderId: order.id }, select: { promotionId: true } });
        for (const r of redemptions) {
          await tx.promotion.update({ where: { id: r.promotionId }, data: { usageCount: { increment: 1 } } });
        }
      });
    } else if (event.type === "payment.failed") {
      await db.$transaction(async (tx) => {
        const settled = await tx.order.updateMany({
          where: { id: order.id, status: "PENDING", paymentStatus: "PENDING" },
          data: { status: "CANCELLED", paymentStatus: "FAILED", cancelledAt: now },
        });
        if (settled.count === 0) return;
        for (const it of order.items) {
          await releaseInventory(tx, it.variantId, it.quantity);
        }
        await tx.couponRedemption.deleteMany({ where: { orderId: order.id } });
        await tx.payment.updateMany({ where: { orderId: order.id, status: "PENDING" }, data: { status: "FAILED", processedAt: now, failureReason: "Clover webhook: payment failed" } });
      });
      await sendPaymentFailureEmail(order.email, order.orderNumber).catch(() => {});
    }

    await db.webhookEvent.update({ where: { id: whEvent.id }, data: { status: "PROCESSED", processedAt: now } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    await db.webhookEvent.update({ where: { id: whEvent.id }, data: { status: "FAILED", error: String(e) } });
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
