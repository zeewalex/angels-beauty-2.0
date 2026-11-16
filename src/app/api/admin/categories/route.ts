import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { errorResponse } from "@/lib/schemas";

const createSchema = z.object({ name: z.string().min(1).max(80), slug: z.string().min(1).max(80).optional() });

export async function GET(req: Request) {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  const categories = await db.category.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } });
  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid category.", 400);
  const { name, slug } = parsed.data;
  const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const dup = await db.category.findUnique({ where: { slug: finalSlug } });
  if (dup) return errorResponse("Slug already exists.", 409);
  const cat = await db.category.create({ data: { name, slug: finalSlug, isActive: true } });
  await logAudit(session, "category.create", "Category", cat.id, `Created category "${name}"`);
  return NextResponse.json({ ok: true, id: cat.id });
}
