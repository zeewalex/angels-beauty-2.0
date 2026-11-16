import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { errorResponse } from "@/lib/schemas";

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  categoryId: z.string().min(1).optional(),
  isFeatured: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isTrending: z.boolean().optional(),
  // NOTE: no image fields here — images are managed via dedicated endpoints.
});

const variantSchema = z.object({
  priceCents: z.number().int().min(0).optional(),
  stock: z.number().int().min(0).optional(),
});

/** GET /api/admin/products/[id] — product detail with variants + images. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  const { id } = await params;
  const product = await db.product.findUnique({
    where: { id },
    include: { category: true, variants: { include: { inventory: true } }, images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!product) return errorResponse("Product not found.", 404);
  return NextResponse.json({ product });
}

/** PATCH /api/admin/products/[id] — update product details (NOT images). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid data.", 400);
  const existing = await db.product.findUnique({ where: { id }, select: { name: true } });
  if (!existing) return errorResponse("Product not found.", 404);
  await db.product.update({ where: { id }, data: parsed.data });
  await logAudit(session, "product.update", "Product", id, `Updated "${existing.name}"`);
  return NextResponse.json({ ok: true });
}

/** POST /api/admin/products/[id]?action=archive|restore — soft-archive / restore. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  const { id } = await params;
  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const existing = await db.product.findUnique({ where: { id }, select: { name: true, status: true } });
  if (!existing) return errorResponse("Product not found.", 404);
  if (action === "archive") {
    await db.product.update({ where: { id }, data: { status: "ARCHIVED" } });
    await db.productVariant.updateMany({ where: { productId: id }, data: { archivedAt: new Date() } });
    await logAudit(session, "product.archive", "Product", id, `Archived "${existing.name}"`);
  } else if (action === "restore") {
    await db.product.update({ where: { id }, data: { status: "ACTIVE" } });
    await db.productVariant.updateMany({ where: { productId: id }, data: { archivedAt: null } });
    await logAudit(session, "product.restore", "Product", id, `Restored "${existing.name}"`);
  } else {
    return errorResponse("Unknown action.", 400);
  }
  return NextResponse.json({ ok: true });
}

/** PATCH /api/admin/products/[id]/variant — update variant price + stock. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = variantSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid variant data.", 400);
  const variant = await db.productVariant.findFirst({ where: { productId: id }, include: { inventory: true, product: { select: { name: true } } } });
  if (!variant) return errorResponse("Variant not found.", 404);
  await db.$transaction(async (tx) => {
    if (parsed.data.priceCents !== undefined) {
      await tx.productVariant.update({ where: { id: variant.id }, data: { priceCents: parsed.data.priceCents } });
      await tx.product.update({ where: { id }, data: { priceMinCents: parsed.data.priceCents, priceMaxCents: parsed.data.priceCents } });
    }
    if (parsed.data.stock !== undefined && variant.inventory) {
      await tx.inventory.update({ where: { variantId: variant.id }, data: { quantity: parsed.data.stock } });
    }
  });
  await logAudit(session, "variant.update", "ProductVariant", variant.id, `Updated price/stock for "${variant.product.name}"`);
  return NextResponse.json({ ok: true });
}
