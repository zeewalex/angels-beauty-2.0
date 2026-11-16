import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveCart, loadCart, GUEST_COOKIE } from "@/lib/cart-server";
import { addToCartSchema, errorResponse } from "@/lib/schemas";

/**
 * POST /api/cart/items — add an item.
 * Server-side validation: variant must be ACTIVE, quantity ≤ available stock.
 * Price is read from the DB (never trusted from the client).
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return errorResponse("Invalid request body", 400);
  const parsed = addToCartSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid item.", 400, { quantity: "Quantity must be 1–99" });

  const { variantId, quantity } = parsed.data;
  const variant = await db.productVariant.findUnique({
    where: { id: variantId },
    include: { inventory: true, product: { select: { status: true, name: true } } },
  });
  if (!variant || !variant.isActive || variant.archivedAt || variant.product.status !== "ACTIVE") {
    return errorResponse("This product is no longer available.", 404);
  }
  const available = variant.inventory?.quantity ?? 0;
  if (variant.inventory?.trackInventory && quantity > available) {
    return errorResponse(`Only ${available} in stock.`, 409, { quantity: `Max ${available}` });
  }

  const { cart, guestId } = await resolveCart();
  // upsert the line (merge quantity if same variant, capped at stock)
  const existing = await db.cartItem.findUnique({ where: { cartId_variantId: { cartId: cart.id, variantId } } });
  const newQty = Math.min((existing?.quantity ?? 0) + quantity, available || 999);
  if (existing) {
    await db.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty } });
  } else {
    await db.cartItem.create({ data: { cartId: cart.id, variantId, quantity: Math.min(quantity, available || 999) } });
  }
  const updated = await loadCart(cart.id);
  const res = NextResponse.json(updated);
  if (guestId) res.cookies.set(GUEST_COOKIE, guestId, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/" });
  return res;
}
