import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { resolveCart, loadCart } from "@/lib/cart-server";
import { checkoutSchema, errorResponse } from "@/lib/schemas";
import { reserveInventory, RESERVATION_TTL_MS } from "@/lib/inventory";

/**
 * POST /api/checkout — guest/authed checkout (PENDING order, NO payment).
 *
 * LIFECYCLE (per approved architecture):
 *  - Creates a PENDING order with a PENDING payment (idempotency key).
 *  - RESERVES inventory (reservedQty += qty) — does NOT deduct quantity.
 *  - Sets reservationExpiresAt (now + 30 min). If no payment arrives, the
 *    reservation is released by releaseExpiredReservations().
 *  - Order becomes CONFIRMED/PAID only when a verified payment result arrives
 *    (Phase 3 Clover; for now the dev simulate-payment endpoint).
 *
 * IDEMPOTENCY: pass `Idempotency-Key` header (or body.idempotencyKey). If an
 * order already exists for that key, the existing order is returned (no duplicate).
 *
 * SECURITY: prices + stock recomputed server-side from the DB; no card data;
 * no live Clover/EasyPost.
 */
export async function POST(req: Request) {
  const idempotencyKey =
    req.headers.get("Idempotency-Key") ||
    (await req.clone().json().catch(() => ({}))).idempotencyKey ||
    `auto-${randomBytes(8).toString("hex")}`;

  // Idempotency: if an order with this payment idempotency key exists, return it.
  const existingPayment = await db.payment.findUnique({
    where: { idempotencyKey },
    select: { orderId: true, status: true },
  });
  if (existingPayment) {
    const existingOrder = await db.order.findUnique({
      where: { id: existingPayment.orderId },
      select: { orderNumber: true, totalCents: true, status: true, paymentStatus: true },
    });
    if (existingOrder) {
      return NextResponse.json({ ok: true, idempotentReplay: true, ...existingOrder });
    }
  }

  const body = await req.json().catch(() => null);
  if (!body) return errorResponse("Invalid request body", 400);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[i.path.join(".")] = i.message;
    return errorResponse("Please correct the highlighted fields.", 400, fields);
  }
  const { email, shipping, billingSameAsShipping, billing, customerNote } = parsed.data;
  const session = await getSession();

  const cart = await loadCart();
  if (cart.items.length === 0) return errorResponse("Your cart is empty.", 400);

  // Re-fetch variants from DB and recompute prices + validate stock (server-side)
  const lines: {
    variantId: string; productId: string; name: string; sku: string;
    unitCents: number; quantity: number; lineCents: number; imageUrl: string | null; available: number;
  }[] = [];
  let subtotalCents = 0;
  for (const item of cart.items) {
    const v = await db.productVariant.findUnique({
      where: { id: item.variantId },
      include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } }, inventory: true },
    });
    if (!v || !v.isActive || v.archivedAt || v.product.status !== "ACTIVE") {
      return errorResponse(`${item.name} is no longer available.`, 409);
    }
    const inv = v.inventory;
    const available = inv ? inv.quantity - inv.reservedQty : 0; // available = quantity - reserved
    if (inv?.trackInventory && item.quantity > available) {
      return errorResponse(`Only ${available} of ${v.product.name} available (some stock is reserved).`, 409);
    }
    const unitCents = v.priceCents; // SERVER-SIDE price
    const lineCents = unitCents * item.quantity;
    subtotalCents += lineCents;
    lines.push({
      variantId: v.id, productId: v.productId, name: v.product.name,
      sku: v.sku, unitCents, quantity: item.quantity, lineCents,
      imageUrl: v.product.images[0]?.url ?? null, available,
    });
  }

  const shippingCents = subtotalCents >= 5000 ? 0 : 599;
  const taxCents = 0;

  // --- Promotion validation (only active + authorized + in-date promotions apply) ---
  let discountCents = 0;
  let appliedPromoId: string | null = null;
  let appliedPromoCode: string | null = null;
  let appliedShippingCents = shippingCents;
  if (parsed.data.couponCode) {
    const code = parsed.data.couponCode.trim().toUpperCase();
    const now = new Date();
    const promo = await db.promotion.findFirst({
      where: {
        code,
        isActive: true,
        authorizedBy: { not: null }, // must be authorized
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
    });
    if (!promo) return errorResponse("This coupon code is invalid, expired, or not authorized.", 400, { couponCode: "Invalid coupon" });
    if (promo.usageLimit !== null && promo.usageCount >= promo.usageLimit) {
      return errorResponse("This coupon has reached its usage limit.", 400, { couponCode: "Usage limit reached" });
    }
    if (promo.type === "PERCENTAGE") {
      discountCents = Math.round((subtotalCents * promo.value) / 100);
    } else if (promo.type === "FIXED_AMOUNT") {
      discountCents = Math.min(promo.value, subtotalCents);
    } else if (promo.type === "FREE_SHIPPING") {
      appliedShippingCents = 0;
    }
    appliedPromoId = promo.id;
    appliedPromoCode = promo.code ?? code;
  }
  const totalCents = subtotalCents - discountCents + appliedShippingCents + taxCents;

  const orderNumber = `AB-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const { cart: cartRef } = await resolveCart();
  const reservationExpiresAt = new Date(Date.now() + RESERVATION_TTL_MS);

  try {
    const order = await db.$transaction(async (tx) => {
      const shipAddr = await tx.address.create({
        data: { ...shipping, userId: session?.user.id ?? null, isDefault: false },
      });
      const billAddr = billingSameAsShipping || !billing
        ? shipAddr
        : await tx.address.create({ data: { ...billing, userId: session?.user.id ?? null, isDefault: false } });

      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: session?.user.id ?? null,
          email,
          status: "PENDING", // NOT confirmed — payment pending
          fulfillmentStatus: "UNFULFILLED",
          paymentStatus: "PENDING",
          subtotalCents,
          discountCents,
          shippingCents: appliedShippingCents,
          taxCents,
          totalCents,
          shippingAddressId: shipAddr.id,
          billingAddressId: billAddr.id,
          customerNote,
          reservationExpiresAt,
          placedAt: new Date(),
          items: { create: lines.map((l) => ({
            variantId: l.variantId, productId: l.productId,
            name: l.name, sku: l.sku, unitCents: l.unitCents,
            quantity: l.quantity, lineCents: l.lineCents, imageUrl: l.imageUrl,
          })) },
          payments: { create: [{
            provider: "CLOVER",
            idempotencyKey,
            amountCents: totalCents,
            status: "PENDING", // NOT paid — no provider result yet
          }] },
        },
      });

      // RESERVE inventory (atomic conditional update; abort if insufficient)
      for (const l of lines) {
        const ok = await reserveInventory(tx, l.variantId, l.quantity);
        if (!ok) {
          throw new Error(`INSUFFICIENT_STOCK:${l.variantId}:${l.name}`);
        }
      }

      // clear the cart
      await tx.cartItem.deleteMany({ where: { cartId: cartRef.id } });

      // record coupon redemption + increment usage (only authorized, in-date promotions reach here)
      if (appliedPromoId) {
        await tx.couponRedemption.create({
          data: { orderId: created.id, promotionId: appliedPromoId, code: appliedPromoCode ?? "", discountCents },
        });
        await tx.promotion.update({ where: { id: appliedPromoId }, data: { usageCount: { increment: 1 } } });
      }

      return created;
    });

    return NextResponse.json({
      ok: true,
      orderNumber: order.orderNumber,
      totalCents,
      status: "PENDING",
      paymentStatus: "PENDING",
      reservationExpiresAt: reservationExpiresAt.toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.startsWith("INSUFFICIENT_STOCK")) {
      const name = msg.split(":").slice(2).join(":");
      return errorResponse(`Not enough stock for ${name}. Please reduce the quantity and try again.`, 409);
    }
    console.error("Checkout failed:", msg);
    return errorResponse("Checkout failed. Please try again.", 500);
  }
}
