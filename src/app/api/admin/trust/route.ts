import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import {
  createTrustedToken,
  hashToken,
  TRUSTED_COOKIE_NAME,
  TRUSTED_COOKIE_OPTIONS,
  validateAdminSecrets,
} from "@/lib/trusted-device";

/**
 * POST /api/admin/trust — one-time trusted-device enrollment.
 *
 * Body: { email, password, pin }
 *
 * This is the ONLY endpoint that issues a trusted-device cookie. It requires
 * ALL THREE:
 *   1. Valid admin email + password (credentials check against the DB).
 *   2. Correct ADMIN_PIN (out-of-band secret from env).
 *
 * After verifying, it:
 *   - Creates a TrustedDevice record in the DB (token hash + metadata).
 *   - Sets a long-lived signed trusted-device cookie.
 *   - Returns { ok: true, deviceId }.
 *
 * The five-tap shortcut then reads this cookie (via the server) to grant
 * immediate admin access. Revocation = set revokedAt on the TrustedDevice row.
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
  // Validate secrets are configured.
  const secrets = validateAdminSecrets();
  if (!secrets.ok) {
    return NextResponse.json(
      { error: "Trusted-device enrollment is not properly configured." },
      { status: 503 },
    );
  }

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

  // Verify PIN (out-of-band secret). Use constant-time comparison.
  const expectedPin = process.env.ADMIN_PIN!;
  if (pin.length !== expectedPin.length || !timingSafeEqualStr(pin, expectedPin)) {
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

  // Create the trusted-device token + DB record.
  const { token, tokenHash, expiresAt, deviceId } = await createTrustedToken(user.id, user.role);
  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent") || null;

  await db.trustedDevice.create({
    data: {
      id: deviceId,
      userId: user.id,
      tokenHash: await hashToken(token),
      userAgent,
      ipAddress: ip,
      expiresAt,
    },
  });

  // Set the cookie.
  const cookieStore = await cookies();
  cookieStore.set(TRUSTED_COOKIE_NAME, token, TRUSTED_COOKIE_OPTIONS);

  // Update lastLoginAt (audit trail).
  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  }).catch(() => {});

  return NextResponse.json({
    ok: true,
    deviceId,
    user: { email: user.email, name: [user.firstName, user.lastName].filter(Boolean).join(" ") },
  });
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
