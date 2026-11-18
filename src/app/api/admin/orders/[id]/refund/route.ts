import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { checkOrigin } from "@/lib/csrf";
import { createCloverRefund } from "@/lib/clover";
import { errorResponse } from "@/lib/schemas";

const refundSchema = z.object({
  amountCents: z.number().int().positive(),
  restockInventory: z.boolean().default(false),
  reason: z.string().max(500).optional(),
}).strict();

/**
 * POST /api/admin/orders/[id]/refund — authorized refund.
 *
 * - Admin-only + CSRF Origin check.
 * - Supports partial refunds (amountCents ≤ totalCents).
 * - Idempotent (Idempotency-Key header).
 * - Calls Clover refund OUTSIDE any DB transaction.
 * - On success: updates Payment status; optionally restocks inventory; audit log.
 * - Duplicate-request protection via idempotency key.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  if (!checkOrigin(req)) return errorResponse("Forbidden (CSRF).", 403);
  const { id } = await params;

  const idempotencyKey = req.headers.get("Idempotency-Key") || `refund-${id}-${Date.now()}`;

  // Idempotency: if a refund with this key already exists, return it.
  const existingRefund = await db.payment.findFirst({
    where: { orderId: id, idempotencyKey },
  });
  if (existingRefund) {
    return NextResponse.json({ ok: true, idempotentReplay: true, status: existingRefund.status });
  }

  const body = await req.json().catch(() => null);
  const parsed = refundSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid refund data.", 400);

  const order = await db.order.findUnique({
    where: { id },
    include: { payments: { where: { status: "PAID" } }, items: { select: { variantId: true, quantity: true } } },
  });
  if (!order) return errorResponse("Order not found.", 404);
  if (order.paymentStatus !== "PAID" && order.paymentStatus !== "PARTIALLY_PAID") {
    return errorResponse("Order is not in a refundable state (must be PAID or PARTIALLY_PAID).", 409);
  }

  // Amount limit: can't refund more than total − already refunded.
  const alreadyRefunded = order.payments
    .filter((p) => p.status === "REFUNDED" || p.status === "PARTIALLY_PAID")
    .reduce((sum, p) => sum + p.amountCents, 0);
  const maxRefundable = order.totalCents - alreadyRefunded;
  if (parsed.data.amountCents > maxRefundable) {
    return errorResponse(`Refund amount exceeds refundable total ($${(maxRefundable / 100).toFixed(2)}).`, 400);
  }

  // Find the original paid payment to refund against.
  const originalPayment = order.payments.find((p) => p.status === "PAID");
  if (!originalPayment?.providerPaymentId) {
    return errorResponse("No paid provider payment found to refund.", 409);
  }

  // Call Clover refund OUTSIDE any DB transaction.
  const refundResult = await createCloverRefund({
    providerPaymentId: originalPayment.providerPaymentId,
    amountCents: parsed.data.amountCents,
    idempotencyKey,
  });

  if (!refundResult.ok) {
    return errorResponse(refundResult.failureReason || "Refund failed.", 502);
  }

  // Record the refund + update order/payment status.
  const now = new Date();
  const isFullRefund = parsed.data.amountCents >= maxRefundable;
  await db.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        orderId: id,
        provider: "CLOVER",
        providerPaymentId: refundResult.providerPaymentId,
        idempotencyKey,
        amountCents: -parsed.data.amountCents, // negative = refund
        status: "REFUNDED",
        processedAt: now,
      },
    });
    await tx.order.update({
      where: { id },
      data: { status: isFullRefund ? "REFUNDED" : "CONFIRMED", paymentStatus: isFullRefund ? "REFUNDED" : "PARTIALLY_PAID" },
    });
    // Controlled inventory restocking (only if explicitly requested).
    if (parsed.data.restockInventory) {
      for (const it of order.items) {
        await tx.inventory.update({
          where: { variantId: it.variantId },
          data: { quantity: { increment: it.quantity } },
        });
      }
    }
  });

  await logAudit(session, "order.refund", "Order", id, `Refunded $${(parsed.data.amountCents / 100).toFixed(2)}${parsed.data.restockInventory ? " + restocked" : ""}`);
  return NextResponse.json({ ok: true, refundAmountCents: parsed.data.amountCents, status: isFullRefund ? "REFUNDED" : "PARTIALLY_PAID" });
}
