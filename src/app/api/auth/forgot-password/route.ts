import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { forgotPasswordSchema, errorResponse } from "@/lib/schemas";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return errorResponse("Invalid request body", 400);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Enter a valid email.", 400, { email: "Invalid email" });
  const email = parsed.data.email;
  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  // Always respond ok to avoid leaking which emails exist.
  if (user) {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await db.verificationToken.create({ data: { userId: user.id, email, token, purpose: "PASSWORD_RESET", expiresAt } });
    // No email service yet — log the reset link for dev. Phase 3 wires transactional email.
    const resetUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
    console.log(`[dev] Password reset link for ${email}: ${resetUrl}`);
  }
  return NextResponse.json({ ok: true, message: "If an account exists for that email, a reset link has been sent." });
}
