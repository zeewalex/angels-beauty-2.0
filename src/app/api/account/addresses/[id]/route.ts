import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { errorResponse } from "@/lib/schemas";

/** PATCH /api/account/addresses/[id] — set default. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession({ redirect: false });
  if (!session) return errorResponse("Please sign in.", 401);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const existing = await db.address.findUnique({ where: { id }, select: { userId: true } });
  if (!existing || existing.userId !== session.user.id) return errorResponse("Address not found.", 404);
  if (body.isDefault) {
    await db.address.updateMany({ where: { userId: session.user.id, isDefault: true }, data: { isDefault: false } });
  }
  await db.address.update({ where: { id }, data: { isDefault: !!body.isDefault } });
  return NextResponse.json({ ok: true });
}

/** DELETE /api/account/addresses/[id] — remove. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession({ redirect: false });
  if (!session) return errorResponse("Please sign in.", 401);
  const { id } = await params;
  const existing = await db.address.findUnique({ where: { id }, select: { userId: true } });
  if (!existing || existing.userId !== session.user.id) return errorResponse("Address not found.", 404);
  await db.address.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
