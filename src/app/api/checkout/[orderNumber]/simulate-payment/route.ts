import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commitInventory, releaseInventory } from "@/lib/inventory";
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
  if (process.env.NODE_ENV === "production") {
    return errorResponse("Not available in production.", 404);
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
    await db.$transaction(async (tx) => {
      for (const it of order.items) {
        await commitInventory(tx, it.variantId, it.quantity);
      }
      await tx.order.update({
        where: { id: order.id },
        data: { status: "CONFIRMED", paymentStatus: "PAID" },
      });
      await tx.payment.updateMany({
        where: { orderId: order.id, status: "PENDING" },
        data: { status: "PAID", processedAt: now },
      });
    });
    return NextResponse.json({ ok: true, outcome: "success", status: "CONFIRMED", paymentStatus: "PAID" });
  } else {
    // failure
    await db.$transaction(async (tx) => {
      for (const it of order.items) {
        await releaseInventory(tx, it.variantId, it.quantity);
      }
      await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED", paymentStatus: "FAILED", cancelledAt: now },
      });
      await tx.payment.updateMany({
        where: { orderId: order.id, status: "PENDING" },
        data: { status: "FAILED", processedAt: now, failureReason: "Simulated payment failure" },
      });
    });
    return NextResponse.json({ ok: true, outcome: "failure", status: "CANCELLED", paymentStatus: "FAILED" });
  }
}
