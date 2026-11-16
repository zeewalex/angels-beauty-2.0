import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { errorResponse } from "@/lib/schemas";

const patchSchema = z.object({ isPrimary: z.boolean().optional(), altText: z.string().max(200).optional(), sortOrder: z.number().int().optional() });

/** PATCH /api/admin/images/[id] — set primary / alt text / order. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid data.", 400);
  const img = await db.productImage.findUnique({ where: { id }, include: { product: { select: { name: true } } } });
  if (!img) return errorResponse("Image not found.", 404);
  await db.productImage.update({ where: { id }, data: parsed.data });
  if (parsed.data.isPrimary) {
    await db.productImage.updateMany({ where: { productId: img.productId, id: { not: id } }, data: { isPrimary: false } });
  }
  await logAudit(session, "image.update", "ProductImage", id, `Updated image for "${img.product.name}"`);
  return NextResponse.json({ ok: true });
}

/** DELETE /api/admin/images/[id] — remove an image row (Cloudinary asset untouched). */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  const { id } = await params;
  const img = await db.productImage.findUnique({ where: { id }, include: { product: { select: { name: true } } } });
  if (!img) return errorResponse("Image not found.", 404);
  await db.productImage.delete({ where: { id } });
  if (img.isPrimary) {
    const next = await db.productImage.findFirst({ where: { productId: img.productId }, orderBy: { sortOrder: "asc" } });
    if (next) await db.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
  }
  await logAudit(session, "image.delete", "ProductImage", id, `Removed image from "${img.product.name}"`);
  return NextResponse.json({ ok: true });
}
