import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { checkOrigin } from "@/lib/csrf";
import { errorResponse } from "@/lib/schemas";

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().optional(),
  published: z.boolean().optional(),
}).strict();

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  if (!checkOrigin(req)) return errorResponse("Forbidden (CSRF).", 403);
  const { slug } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid data.", 400);
  const existing = await db.page.findUnique({ where: { slug } });
  if (!existing) return errorResponse("Page not found.", 404);
  await db.page.update({ where: { slug }, data: parsed.data });
  await logAudit(session, "page.update", "Page", existing.id, `Updated "${existing.title}"`);
  return NextResponse.json({ ok: true });
}
