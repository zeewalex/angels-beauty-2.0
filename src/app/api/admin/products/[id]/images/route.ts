import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { checkOrigin } from "@/lib/csrf";
import { errorResponse } from "@/lib/schemas";

/**
 * Dedicated product-image management — SEPARATE from product/variant/price/stock
 * edits. Editing a product never touches these rows; images are only mutated
 * through these endpoints.
 */

/** GET /api/admin/products/[id]/images — list a product's images. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  if (!checkOrigin(req)) return errorResponse("Forbidden (CSRF).", 403);
  const { id } = await params;
  const images = await db.productImage.findMany({ where: { productId: id }, orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ images });
}

const addSchema = z.object({ url: z.string().url(), altText: z.string().max(200).optional(), isPrimary: z.boolean().optional() });

/** POST /api/admin/products/[id]/images — add an image (URL; Cloudinary upload is Phase 3). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  if (!checkOrigin(req)) return errorResponse("Forbidden (CSRF).", 403);
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid image data.", 400);
  const product = await db.product.findUnique({ where: { id }, select: { name: true } });
  if (!product) return errorResponse("Product not found.", 404);
  const publicId = parsed.data.url.split("/").pop()?.split(".")[0] ?? `img-${Date.now()}`;
  const count = await db.productImage.count({ where: { productId: id } });
  const img = await db.productImage.create({
    data: { productId: id, cloudinaryPublicId: `${id}-${publicId}-${count}`, url: parsed.data.url, altText: parsed.data.altText ?? product.name, sortOrder: count, isPrimary: parsed.data.isPrimary ?? count === 0 },
  });
  if (parsed.data.isPrimary) {
    await db.productImage.updateMany({ where: { productId: id, id: { not: img.id } }, data: { isPrimary: false } });
  }
  await logAudit(session, "image.add", "ProductImage", img.id, `Added image to "${product.name}"`);
  return NextResponse.json({ ok: true, id: img.id });
}
