import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { resolveCart, loadCart } from "@/lib/cart-server";
import { checkoutSchema, errorResponse } from "@/lib/schemas";

/**
 * POST /api/checkout — guest/authed checkout.
 *
 * SECURITY (per requirements):
 *  - Prices are recomputed SERVER-SIDE from the DB (never trusted from client).
 *  - Stock validated SERVER-SIDE before the order is created.
 *  - No payment card details are stored.
 *  - No live Clover/EasyPost calls (Phase 3). Order is created PENDING.
 *
 * Creates the order + snapshot items + addresses in a single $transaction,
 * deducts inventory, and clears the cart.
 */
export async function POST(req: Request) {
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

  // Load cart (server source of truth)
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
    const available = v.inventory?.quantity ?? 0;
    if (v.inventory?.trackInventory && item.quantity > available) {
      return errorResponse(`Only ${available} of ${v.product.name} in stock.`, 409);
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

  // Shipping (flat rule — EasyPost in Phase 3) + tax (0 for now)
  const shippingCents = subtotalCents >= 5000 ? 0 : 599;
  const taxCents = 0;
  const totalCents = subtotalCents + shippingCents + taxCents;

  const orderNumber = `AB-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const { cart: cartRef } = await resolveCart();

  try {
    const order = await db.$transaction(async (tx) => {
      // addresses
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
          status: "PENDING",
          fulfillmentStatus: "UNFULFILLED",
          paymentStatus: "PENDING",
          subtotalCents,
          shippingCents,
          taxCents,
          totalCents,
          shippingAddressId: shipAddr.id,
          billingAddressId: billAddr.id,
          customerNote,
          placedAt: new Date(),
          items: { create: lines.map((l) => ({
            variantId: l.variantId, productId: l.productId,
            name: l.name, sku: l.sku, unitCents: l.unitCents,
            quantity: l.quantity, lineCents: l.lineCents, imageUrl: l.imageUrl,
          })) },
          payments: { create: [{
            provider: "CLOVER",
            idempotencyKey: orderNumber,
            amountCents: totalCents,
            status: "PENDING",
          }] },
        },
      });

      // deduct inventory (Phase 2: direct decrement; Phase 3 moves to reserve+commit-on-payment)
      for (const l of lines) {
        await tx.inventory.update({
          where: { variantId: l.variantId },
          data: { quantity: { decrement: l.quantity } },
        });
      }

      // clear the cart
      await tx.cartItem.deleteMany({ where: { cartId: cartRef.id } });

      return created;
    });

    return NextResponse.json({ ok: true, orderNumber: order.orderNumber, totalCents });
  } catch (e) {
    console.error("Checkout failed:", e);
    return errorResponse("Checkout failed. Please try again.", 500);
  }
}
