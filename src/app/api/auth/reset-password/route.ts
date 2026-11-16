import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { resetPasswordSchema, errorResponse } from "@/lib/schemas";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return errorResponse("Invalid request body", 400);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[issue.path.join(".")] = issue.message;
    return errorResponse("Please correct the highlighted fields.", 400, fields);
  }
  const { token, password } = parsed.data;
  const record = await db.verificationToken.findFirst({
    where: { token, purpose: "PASSWORD_RESET", usedAt: null, expiresAt: { gt: new Date() } },
  });
  if (!record || !record.userId) return errorResponse("This reset link is invalid or has expired.", 400, { token: "Invalid or expired" });
  const passwordHash = await hashPassword(password);
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    db.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  return NextResponse.json({ ok: true });
}
