import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { addressSchema, errorResponse } from "@/lib/schemas";

/** POST /api/account/addresses — add a saved address. */
export async function POST(req: Request) {
  const session = await requireSession({ redirect: false });
  if (!session) return errorResponse("Please sign in.", 401);
  const body = await req.json().catch(() => null);
  if (!body) return errorResponse("Invalid request body", 400);
  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[i.path.join(".")] = i.message;
    return errorResponse("Please correct the highlighted fields.", 400, fields);
  }
  // only one default at a time
  if (parsed.data && (body as any).isDefault) {
    await db.address.updateMany({ where: { userId: session.user.id, isDefault: true }, data: { isDefault: false } });
  }
  const addr = await db.address.create({
    data: { ...parsed.data, userId: session.user.id, isDefault: !!(body as any).isDefault },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: addr.id });
}
