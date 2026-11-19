import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { checkOrigin } from "@/lib/csrf";
import { errorResponse } from "@/lib/schemas";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  if (!checkOrigin(req)) return errorResponse("Forbidden (CSRF).", 403);
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return errorResponse("Invalid data.", 400);
  if (body.publishedAt !== undefined) body.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null;
  await db.blogPost.update({ where: { id }, data: body });
  await logAudit(session, "blog.update", "BlogPost", id, `Updated blog post`);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  if (!checkOrigin(req)) return errorResponse("Forbidden (CSRF).", 403);
  const { id } = await params;
  await db.blogPost.delete({ where: { id } });
  await logAudit(session, "blog.delete", "BlogPost", id, `Deleted blog post`);
  return NextResponse.json({ ok: true });
}
