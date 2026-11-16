import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const GUEST_COOKIE = "angels_guest_sid";

type CartLine = {
  id: string;
  variantId: string;
  productId: string;
  name: string;
  slug: string;
  priceCents: number;
  quantity: number;
  stock: number;
  imageUrl: string | null;
  lineCents: number;
};

export type SerializedCart = {
  id: string;
  items: CartLine[];
  subtotalCents: number;
  itemCount: number;
};

/** Resolve the cart for the current request (authed by userId, guest by cookie). */
export async function resolveCart(): Promise<{
  cart: { id: string };
  guestId?: string;
}> {
  const session = await getSession();
  const cookieStore = await cookies();
  if (session) {
    const existing = await db.cart.findUnique({ where: { userId: session.user.id }, select: { id: true } });
    if (existing) return { cart: existing };
    const created = await db.cart.create({ data: { userId: session.user.id }, select: { id: true } });
    return { cart: created };
  }
  // guest
  let guestId = cookieStore.get(GUEST_COOKIE)?.value;
  if (!guestId) {
    guestId = `guest_${crypto.randomUUID()}`;
  }
  const existing = await db.cart.findFirst({ where: { sessionId: guestId }, select: { id: true } });
  if (existing) return { cart: existing, guestId };
  const created = await db.cart.create({ data: { sessionId: guestId }, select: { id: true } });
  return { cart: created, guestId };
}

/** Load the full cart with items + computed subtotal (server-side source of truth). */
export async function loadCart(cartId?: string): Promise<SerializedCart> {
  const id = cartId ?? (await resolveCart()).cart.id;
  const full = await db.cart.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          variant: {
            include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } }, inventory: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!full) return { id: cart.id, items: [], subtotalCents: 0, itemCount: 0 };
  const items: CartLine[] = full.items.map((ci) => ({
    id: ci.id,
    variantId: ci.variantId,
    productId: ci.variant.productId,
    name: ci.variant.product.name,
    slug: ci.variant.product.slug,
    priceCents: ci.variant.priceCents,
    quantity: ci.quantity,
    stock: ci.variant.inventory?.quantity ?? 0,
    imageUrl: ci.variant.product.images[0]?.url ?? null,
    lineCents: ci.variant.priceCents * ci.quantity,
  }));
  const subtotalCents = items.reduce((n, i) => n + i.lineCents, 0);
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);
  return { id: full.id, items, subtotalCents, itemCount };
}
