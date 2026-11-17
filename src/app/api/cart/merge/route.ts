import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { GUEST_COOKIE, loadCart } from "@/lib/cart-server";
import { errorResponse } from "@/lib/schemas";

/**
 * POST /api/cart/merge — merge a guest cart into the signed-in user's cart.
 *
 * Called after successful login. Reads the guest session cookie, finds the
 * guest cart, and merges each line into the user's cart (quantities summed,
 * capped at available stock). Then deletes the guest cart + clears the cookie.
 * Safe if there's no guest cart (no-op).
 */
export async function POST() {
  const session = await requireSession({ redirect: false });
  if (!session) return errorResponse("Please sign in.", 401);

  const cookieStore = await cookies();
  const guestId = cookieStore.get(GUEST_COOKIE)?.value;
  if (!guestId) {
    return NextResponse.json({ ok: true, merged: 0 });
  }

  const guestCart = await db.cart.findFirst({ where: { sessionId: guestId }, include: { items: true } });
  if (!guestCart || guestCart.items.length === 0) {
    if (guestCart) await db.cart.delete({ where: { id: guestCart.id } }).catch(() => {});
    const res = NextResponse.json({ ok: true, merged: 0 });
    res.cookies.delete(GUEST_COOKIE);
    return res;
  }

  let userCart = await db.cart.findUnique({ where: { userId: session.user.id }, include: { items: true } });
  if (!userCart) {
    userCart = await db.cart.create({ data: { userId: session.user.id }, include: { items: true } });
  }

  let merged = 0;
  for (const guestItem of guestCart.items) {
    const variant = await db.productVariant.findUnique({
      where: { id: guestItem.variantId },
      include: { inventory: true },
    });
    const available = variant?.inventory ? variant.inventory.quantity - variant.inventory.reservedQty : 0;
    const existing = userCart.items.find((i) => i.variantId === guestItem.variantId);
    if (existing) {
      const newQty = Math.min(existing.quantity + guestItem.quantity, available || 999);
      if (newQty !== existing.quantity) {
        await db.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty } });
      }
    } else {
      await db.cartItem.create({
        data: { cartId: userCart.id, variantId: guestItem.variantId, quantity: Math.min(guestItem.quantity, available || 999) },
      });
    }
    merged++;
  }

  await db.cart.delete({ where: { id: guestCart.id } }).catch(() => {});
  const data = await loadCart(userCart.id);
  const res = NextResponse.json({ ok: true, merged, itemCount: data.itemCount });
  res.cookies.delete(GUEST_COOKIE);
  return res;
}
