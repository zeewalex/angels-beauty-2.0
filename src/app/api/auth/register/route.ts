import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { registerSchema, errorResponse } from "@/lib/schemas";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return errorResponse("Invalid request body", 400);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[issue.path.join(".")] = issue.message;
    return errorResponse("Please correct the highlighted fields.", 400, fields);
  }
  const { firstName, lastName, email, password } = parsed.data;
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return errorResponse("An account with this email already exists.", 409, { email: "Email already registered" });
  const passwordHash = await hashPassword(password);
  await db.user.create({
    data: { firstName, lastName, email, passwordHash, role: "CUSTOMER", status: "ACTIVE" },
    select: { id: true },
  });
  return NextResponse.json({ ok: true });
}
