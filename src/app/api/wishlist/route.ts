import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { errorResponse } from "@/lib/schemas";

const bodySchema = z.object({ productId: z.string().min(1) });

/** GET /api/wishlist — list the signed-in user's wishlist products. */
export async function GET() {
  const session = await requireSession({ redirect: false });
  if (!session) return NextResponse.json({ items: [], authed: false });
  const rows = await db.wishlistItem.findMany({
    where: { userId: session.user.id },
    include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } },
    orderBy: { createdAt: "desc" },
  });
  const items = rows.map((r) => ({
    productId: r.productId,
    name: r.product.name,
    slug: r.product.slug,
    priceCents: r.product.priceMinCents ?? 0,
    imageUrl: r.product.images[0]?.url ?? null,
    stock: 0, // stock lives on the variant; left for UI compat
  }));
  return NextResponse.json({ items, authed: true });
}

/** POST /api/wishlist — add a product to the wishlist. */
export async function POST(req: Request) {
  const session = await requireSession({ redirect: false });
  if (!session) return errorResponse("Please sign in to save wishlist items.", 401);
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid product.", 400);
  await db.wishlistItem.upsert({
    where: { userId_productId: { userId: session.user.id, productId: parsed.data.productId } },
    create: { userId: session.user.id, productId: parsed.data.productId },
    update: {},
  });
  return NextResponse.json({ ok: true });
}

/** DELETE /api/wishlist — remove a product from the wishlist. */
export async function DELETE(req: Request) {
  const session = await requireSession({ redirect: false });
  if (!session) return errorResponse("Please sign in.", 401);
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid product.", 400);
  await db.wishlistItem.deleteMany({ where: { userId: session.user.id, productId: parsed.data.productId } });
  return NextResponse.json({ ok: true });
}
