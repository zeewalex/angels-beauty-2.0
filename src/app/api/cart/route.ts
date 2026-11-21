import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { loadCart, resolveCart, GUEST_COOKIE } from "@/lib/cart-server";
import { db } from "@/lib/db";

/** GET /api/cart — returns the cart with items + server-computed subtotal. */
export async function GET() {
  try {
    const { cart, guestId } = await resolveCart();
    const data = await loadCart(cart.id);
    const res = NextResponse.json(data);
    if (guestId) res.cookies.set(GUEST_COOKIE, guestId, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/" });
    return res;
  } catch {
    // DB unavailable — return empty cart.
    return NextResponse.json({ id: "guest", items: [], subtotalCents: 0, itemCount: 0 });
  }
}

/** DELETE /api/cart — clear all items. */
export async function DELETE() {
  try {
    const { cart } = await resolveCart();
    await db.cartItem.deleteMany({ where: { cartId: cart.id } });
    const updated = await loadCart(cart.id);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ id: "guest", items: [], subtotalCents: 0, itemCount: 0 });
  }
}
