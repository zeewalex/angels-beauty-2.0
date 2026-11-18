import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commitInventory, releaseInventory } from "@/lib/inventory";
import { sendPaymentSuccessReceipt, sendPaymentFailureEmail } from "@/lib/email";
import { errorResponse } from "@/lib/schemas";

/**
 * POST /api/checkout/[orderNumber]/simulate-payment
 *
 * DEV-ONLY: simulates the Clover payment-provider result so the pending-order
 * lifecycle can be built and tested WITHOUT live payment credentials.
 *   { outcome: "success" } → commit inventory, mark order CONFIRMED + PAID.
 *   { outcome: "failure" } → release reservation, mark order CANCELLED + FAILED.
 *
 * Guarded to non-production only. Phase 3 replaces this with a real,
 * signature-verified Clover webhook (orders are marked PAID only after the
 * provider result is securely verified).
 */
export async function POST(req: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  // STRICTLY development-only — blocked in staging AND production.
  // Missing credentials in non-dev environments produce explicit errors,
  // never simulated payments.
  if (process.env.NODE_ENV !== "development") {
    return errorResponse("Payment simulation is available in development only.", 404);
  }
  const { orderNumber } = await params;
  const body = await req.json().catch(() => ({}));
  const outcome = body?.outcome === "success" ? "success" : body?.outcome === "failure" ? "failure" : null;
  if (!outcome) return errorResponse("Provide { outcome: 'success' | 'failure' }.", 400);

  const order = await db.order.findUnique({
    where: { orderNumber },
    include: { items: { select: { variantId: true, quantity: true } }, payments: true },
  });
  if (!order) return errorResponse("Order not found.", 404);

  // Idempotent: if already settled, return current state.
  if (order.paymentStatus === "PAID" || order.status === "CONFIRMED") {
    return NextResponse.json({ ok: true, alreadySettled: true, status: order.status, paymentStatus: order.paymentStatus });
  }
  if (order.status === "CANCELLED") {
    return NextResponse.json({ ok: true, alreadyCancelled: true, status: order.status, paymentStatus: order.paymentStatus });
  }

  const now = new Date();

  if (outcome === "success") {
    const result = await db.$transaction(async (tx) => {
      // Race-safe: only confirm if STILL PENDING/PENDING (a concurrent expiry
      // may have just cancelled it). Conditional update acquires the row lock.
      const settled = await tx.order.updateMany({
        where: { id: order.id, status: "PENDING", paymentStatus: "PENDING" },
        data: { status: "CONFIRMED", paymentStatus: "PAID" },
      });
      if (settled.count === 0) return { raced: true } as const;
      for (const it of order.items) {
        await commitInventory(tx, it.variantId, it.quantity);
      }
      await tx.payment.updateMany({
        where: { orderId: order.id, status: "PENDING" },
        data: { status: "PAID", processedAt: now },
      });
      // Finalize coupon usage (was reserved at checkout, now counted).
      const redemptions = await tx.couponRedemption.findMany({ where: { orderId: order.id }, select: { promotionId: true } });
      for (const r of redemptions) {
        await tx.promotion.update({ where: { id: r.promotionId }, data: { usageCount: { increment: 1 } } });
      }
      return { raced: false } as const;
    });
    if (result.raced) return NextResponse.json({ ok: false, message: "Order is no longer pending (settled by another path)." });
    // Send verified-payment receipt (only after confirmed payment).
    await sendPaymentSuccessReceipt(order.email, order.orderNumber, order.totalCents).catch(() => {});
    return NextResponse.json({ ok: true, outcome: "success", status: "CONFIRMED", paymentStatus: "PAID" });
  } else {
    const result = await db.$transaction(async (tx) => {
      const settled = await tx.order.updateMany({
        where: { id: order.id, status: "PENDING", paymentStatus: "PENDING" },
        data: { status: "CANCELLED", paymentStatus: "FAILED", cancelledAt: now },
      });
      if (settled.count === 0) return { raced: true } as const;
      for (const it of order.items) {
        await releaseInventory(tx, it.variantId, it.quantity);
      }
      await tx.payment.updateMany({
        where: { orderId: order.id, status: "PENDING" },
        data: { status: "FAILED", processedAt: now, failureReason: "Simulated payment failure" },
      });
      // Release coupon reservation (delete the pending redemption).
      await tx.couponRedemption.deleteMany({ where: { orderId: order.id } });
      return { raced: false } as const;
    });
    if (result.raced) return NextResponse.json({ ok: false, message: "Order is no longer pending (settled by another path)." });
    // Send payment failure email.
    await sendPaymentFailureEmail(order.email, order.orderNumber).catch(() => {});
    return NextResponse.json({ ok: true, outcome: "failure", status: "CANCELLED", paymentStatus: "FAILED" });
  }
}
