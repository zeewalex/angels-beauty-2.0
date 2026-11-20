import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import {
  createTrustedToken,
  TRUSTED_COOKIE_NAME,
  TRUSTED_COOKIE_OPTIONS,
} from "@/lib/trusted-device";

/**
 * POST /api/admin/trust — one-time trusted-device enrollment.
 *
 * Body: { email, password, pin }
 *
 * This is the ONLY endpoint that issues a trusted-device cookie. It requires
 * ALL THREE:
 *   1. Valid admin email + password (credentials check against the DB).
 *   2. Correct ADMIN_PIN (out-of-band secret shared with the client).
 *
 * After verifying, it sets a long-lived signed trusted-device cookie and
 * returns { ok: true }. The five-tap shortcut then reads this cookie (via
 * the session check in middleware) to grant immediate admin access.
 *
 * Security:
 *   - Credentials are verified server-side via bcrypt (never returned).
 *   - The PIN is checked against ADMIN_PIN env var (not stored in the DB).
 *   - Rate-limited per IP to prevent brute-force (in-memory; resets on
 *     serverless cold start, but the DB bcrypt check is the primary defence).
 *   - The trusted cookie is HMAC-signed and bound to the admin user id + role.
 */

// In-memory rate limiter (per IP). Resets every 15 minutes. Max 5 attempts.
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX = 5;
const attempts = new Map<string, { count: number; firstAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now - entry.firstAt > RATE_WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAt: now });
    return false;
  }
  entry.count++;
  return entry.count > RATE_MAX;
}

const bodySchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
  pin: z.string().min(4).max(8),
});

export async function POST(req: Request) {
  // Rate limit.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again in 15 minutes." },
      { status: 429 },
    );
  }

  // Parse + validate body.
  let parsed;
  try {
    const json = await req.json();
    parsed = bodySchema.safeParse(json);
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { email, password, pin } = parsed.data;

  // Verify PIN (out-of-band secret).
  const expectedPin = process.env.ADMIN_PIN;
  if (!expectedPin) {
    return NextResponse.json(
      { error: "Trusted-device enrollment is not configured. Set ADMIN_PIN." },
      { status: 503 },
    );
  }
  if (pin !== expectedPin) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  // Verify email + password against the DB.
  const user = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      passwordHash: true,
    },
  });
  if (!user || !user.passwordHash || user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }
  const pwOk = await verifyPassword(password, user.passwordHash);
  if (!pwOk) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  // Must be an admin.
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "This account does not have admin access." }, { status: 403 });
  }

  // Issue the trusted-device cookie.
  const token = await createTrustedToken(user.id, user.role);
  const cookieStore = await cookies();
  cookieStore.set(TRUSTED_COOKIE_NAME, token, TRUSTED_COOKIE_OPTIONS);

  // Also update lastLoginAt (audit trail).
  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  }).catch(() => {});

  return NextResponse.json({
    ok: true,
    user: { email: user.email, name: [user.firstName, user.lastName].filter(Boolean).join(" ") },
  });
}
