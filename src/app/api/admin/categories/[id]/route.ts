import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { checkOrigin } from "@/lib/csrf";
import { errorResponse } from "@/lib/schemas";

const patchSchema = z.object({ name: z.string().min(1).max(80).optional(), isActive: z.boolean().optional() });

/** PATCH /api/admin/categories/[id] — rename / activate. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  if (!checkOrigin(req)) return errorResponse("Forbidden (CSRF).", 403);
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid data.", 400);
  const existing = await db.category.findUnique({ where: { id } });
  if (!existing) return errorResponse("Category not found.", 404);
  await db.category.update({ where: { id }, data: parsed.data });
  await logAudit(session, "category.update", "Category", id, `Updated "${existing.name}"`);
  return NextResponse.json({ ok: true });
}

/** POST /api/admin/categories/[id]?action=archive — soft-archive (isActive=false).
 *  GUARD: refuses if the category still has ACTIVE products (they'd be left
 *  without a valid customer-facing category). Reassign or archive those
 *  products first. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  if (!checkOrigin(req)) return errorResponse("Forbidden (CSRF).", 403);
  const { id } = await params;
  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  if (action !== "archive") return errorResponse("Unknown action.", 400);
  const existing = await db.category.findUnique({ where: { id }, include: { _count: { select: { products: { where: { status: "ACTIVE" } } } } } });
  if (!existing) return errorResponse("Category not found.", 404);
  // GUARD: no active products may remain in this category
  const activeCount = (existing._count as any).products ?? existing._count?.products ?? 0;
  // Prisma's _count with a where filter returns a number; recompute to be safe
  const realActive = await db.product.count({ where: { categoryId: id, status: "ACTIVE" } });
  if (realActive > 0) {
    return errorResponse(`Cannot archive: ${realActive} active product(s) still use this category. Reassign or archive them first.`, 409);
  }
  await db.category.update({ where: { id }, data: { isActive: false } });
  await logAudit(session, "category.archive", "Category", id, `Archived "${existing.name}" (0 active products)`);
  return NextResponse.json({ ok: true });
}
