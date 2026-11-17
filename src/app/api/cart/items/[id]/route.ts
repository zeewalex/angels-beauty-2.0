import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveCart, loadCart } from "@/lib/cart-server";
import { updateCartSchema, errorResponse } from "@/lib/schemas";

/** PATCH /api/cart/items/[id] — update quantity (server validates stock limit). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return errorResponse("Invalid request body", 400);
  const parsed = updateCartSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Quantity must be 1–99.", 400);

  const { cart } = await resolveCart();
  const item = await db.cartItem.findUnique({ where: { id }, include: { variant: { include: { inventory: true } } } });
  if (!item || item.cartId !== cart.id) return errorResponse("Item not found.", 404);
  const available = item.variant.inventory?.quantity ?? 0;
  if (item.variant.inventory?.trackInventory && parsed.data.quantity > available) {
    return errorResponse(`Only ${available} in stock.`, 409, { quantity: `Max ${available}` });
  }
  await db.cartItem.update({ where: { id }, data: { quantity: parsed.data.quantity } });
  const updated = await loadCart(cart.id);
  return NextResponse.json(updated);
}

/** DELETE /api/cart/items/[id] — remove an item. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { cart } = await resolveCart();
  const item = await db.cartItem.findUnique({ where: { id }, select: { cartId: true } });
  if (!item || item.cartId !== cart.id) return errorResponse("Item not found.", 404);
  await db.cartItem.delete({ where: { id } });
  const updated = await loadCart(cart.id);
  return NextResponse.json(updated);
}
