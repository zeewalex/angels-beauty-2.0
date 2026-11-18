import { db } from "@/lib/db";
import { checkCloverPaymentStatus } from "@/lib/clover";

/**
 * Inventory reservation lifecycle.
 *
 *  - reserve:   reservedQty += qty  (at order creation; stock held but not deducted)
 *  - commit:    reservedQty -= qty, quantity -= qty  (on verified payment success)
 *  - release:   reservedQty -= qty  (on payment failure or reservation expiry)
 *
 * Available stock = quantity - reservedQty. A PENDING order never deducts
 * `quantity`; it only holds a reservation. If payment never succeeds, the
 * reservation expires and stock is returned to the pool.
 */

export const RESERVATION_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Hold stock for an order (within a transaction).
 * Uses an ATOMIC conditional UPDATE (row-locked by Postgres) so concurrent
 * reservations cannot over-commit: the increment only happens if
 * (quantity - reservedQty) >= qty. Returns false if there isn't enough
 * available stock (caller should abort the transaction).
 */
export async function reserveInventory(
  tx: Parameters<Parameters<typeof db["$transaction"]>[0]>[0],
  variantId: string,
  qty: number,
): Promise<boolean> {
  const affected = await tx.$executeRaw`
    UPDATE "Inventory"
    SET "reservedQty" = "reservedQty" + ${qty}
    WHERE "variantId" = ${variantId}
      AND ("quantity" - "reservedQty") >= ${qty}
  `;
  return affected > 0;
}

/** Commit a reservation into a real stock deduction (on verified payment). */
export async function commitInventory(
  tx: Parameters<Parameters<typeof db["$transaction"]>[0]>[0],
  variantId: string,
  qty: number,
): Promise<void> {
  await tx.inventory.update({
    where: { variantId },
    data: { reservedQty: { decrement: qty }, quantity: { decrement: qty } },
  });
}

/** Release a reservation back to available stock (failed/expired payment). */
export async function releaseInventory(
  tx: Parameters<Parameters<typeof db["$transaction"]>[0]>[0],
  variantId: string,
  qty: number,
): Promise<void> {
  // clamp so reservedQty never goes negative
  const inv = await tx.inventory.findUnique({ where: { variantId }, select: { reservedQty: true } });
  if (!inv) return;
  const dec = Math.min(qty, inv.reservedQty);
  if (dec > 0) {
    await tx.inventory.update({ where: { variantId }, data: { reservedQty: { decrement: dec } } });
  }
}

/**
 * Release all expired reservations.
 * Finds PENDING orders with paymentStatus PENDING past their reservationExpiresAt,
 * releases each line's reservation, and marks the order CANCELLED + payment FAILED.
 * Safe to run repeatedly (idempotent — only touches still-PENDING orders).
 */
export async function releaseExpiredReservations(): Promise<{ released: number; reconciled: number; pending: number }> {
  const now = new Date();
  const MAX_HOLD_MS = 24 * 60 * 60 * 1000; // 24h max hold before forced cancellation
  const expired = await db.order.findMany({
    where: {
      status: "PENDING",
      paymentStatus: "PENDING",
      reservationExpiresAt: { lt: now },
    },
    include: { items: { select: { variantId: true, quantity: true } }, payments: { where: { status: "PENDING" }, select: { providerPaymentId: true } } },
    take: 100,
  });
  if (expired.length === 0) return { released: 0, reconciled: 0, pending: 0 };

  let released = 0, reconciled = 0, pendingRetry = 0;

  for (const order of expired) {
    const providerPaymentId = order.payments[0]?.providerPaymentId;
    if (providerPaymentId) {
      const providerStatus = await checkCloverPaymentStatus(providerPaymentId);
      if (providerStatus === "paid") {
        // Provider confirms payment — confirm instead of cancelling.
        await db.$transaction(async (tx) => {
          const settled = await tx.order.updateMany({
            where: { id: order.id, status: "PENDING", paymentStatus: "PENDING" },
            data: { status: "CONFIRMED", paymentStatus: "PAID" },
          });
          if (settled.count === 0) return; // race-lost
          for (const it of order.items) { await commitInventory(tx, it.variantId, it.quantity); }
          const redemptions = await tx.couponRedemption.findMany({ where: { orderId: order.id }, select: { promotionId: true } });
          for (const r of redemptions) { await tx.promotion.update({ where: { id: r.promotionId }, data: { usageCount: { increment: 1 } } }); }
          await tx.payment.updateMany({ where: { orderId: order.id, status: "PENDING" }, data: { status: "PAID", processedAt: now } });
        });
        reconciled++;
        continue;
      }
      if (providerStatus === "failed") {
        // Provider confirms failure — cancel + release.
        await db.$transaction(async (tx) => {
          const settled = await tx.order.updateMany({ where: { id: order.id, status: "PENDING", paymentStatus: "PENDING" }, data: { status: "CANCELLED", paymentStatus: "FAILED", cancelledAt: now } });
          if (settled.count === 0) return;
          for (const it of order.items) { await releaseInventory(tx, it.variantId, it.quantity); }
          await tx.couponRedemption.deleteMany({ where: { orderId: order.id } });
          await tx.payment.updateMany({ where: { orderId: order.id, status: "PENDING" }, data: { status: "FAILED", failureReason: "Provider confirmed failure" } });
        });
        released++;
        continue;
      }
      // providerStatus === "unknown" or "pending" — DO NOT auto-cancel.
      // Check if max hold (24h past expiry) is exceeded → forced cancellation as last resort.
      const maxHoldExceeded = order.reservationExpiresAt && (now.getTime() - order.reservationExpiresAt.getTime()) > MAX_HOLD_MS;
      if (!maxHoldExceeded) {
        // Leave PENDING for retry on the next cron run. Inventory stays reserved.
        pendingRetry++;
        continue;
      }
      // Max hold exceeded + provider still unreachable → forced cancel (escalation).
      console.error(`[reconciliation] Order ${order.orderNumber}: max hold exceeded, provider unreachable. Forced cancellation.`);
    }
    // Default: cancel + release (no provider payment, or max hold exceeded).
    await db.$transaction(async (tx) => {
      const settled = await tx.order.updateMany({ where: { id: order.id, status: "PENDING", paymentStatus: "PENDING" }, data: { status: "CANCELLED", paymentStatus: "FAILED", cancelledAt: now } });
      if (settled.count === 0) return;
      for (const it of order.items) { await releaseInventory(tx, it.variantId, it.quantity); }
      await tx.couponRedemption.deleteMany({ where: { orderId: order.id } });
      await tx.payment.updateMany({ where: { orderId: order.id, status: "PENDING" }, data: { status: "FAILED", failureReason: providerPaymentId ? "Reconciliation failed: provider unreachable after max hold" : "Reservation expired (no payment)" } });
    });
    released++;
  }
  return { released, reconciled, pendingRetry };
}
