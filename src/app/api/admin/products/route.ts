import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { errorResponse } from "@/lib/schemas";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().default(""),
  categoryId: z.string().min(1),
  priceCents: z.number().int().min(0),
  stock: z.number().int().min(0).default(0),
});

/** GET /api/admin/products — list products (with variants + inventory). */
export async function GET(req: Request) {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.toLowerCase();
  const products = await db.product.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    include: { category: { select: { name: true, slug: true } }, variants: { include: { inventory: true }, take: 1 }, images: { take: 1, orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ products });
}

/** POST /api/admin/products — create a product + a single variant + inventory. */
export async function POST(req: Request) {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid product data.", 400);
  const { name, slug, description, categoryId, priceCents, stock } = parsed.data;
  const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const dup = await db.product.findUnique({ where: { slug: finalSlug } });
  if (dup) return errorResponse("Slug already exists.", 409);
  const product = await db.$transaction(async (tx) => {
    const p = await tx.product.create({
      data: { name, slug: finalSlug, description, categoryId, status: "ACTIVE", priceMinCents: priceCents, priceMaxCents: priceCents },
    });
    const v = await tx.productVariant.create({
      data: { productId: p.id, sku: finalSlug.toUpperCase().replace(/-/g, "_"), priceCents, isActive: true,
        inventory: { create: { quantity: stock, lowStockThreshold: 10, trackInventory: true } } },
    });
    return { p, v };
  });
  await logAudit(session, "product.create", "Product", product.p.id, `Created "${name}" at $${(priceCents / 100).toFixed(2)}`);
  return NextResponse.json({ ok: true, id: product.p.id, slug: product.p.slug });
}
