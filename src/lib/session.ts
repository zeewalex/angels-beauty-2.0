import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { authOptions, type AppSession } from "@/lib/auth";
import {
  verifyTrustedToken,
  hashToken,
  TRUSTED_COOKIE_NAME,
} from "@/lib/trusted-device";

/**
 * Get the current session (or null) on the server.
 *
 * Tries NextAuth first. If no NextAuth session, checks for a trusted-device
 * cookie and does a FULL DB-backed revocation check:
 *   1. Verify the token's HMAC (tamper check).
 *   2. Check expiry.
 *   3. Look up the token hash in the TrustedDevice table.
 *   4. If the record doesn't exist → denied (token was revoked / DB reset).
 *   5. If revokedAt is set → denied (admin revoked the device).
 *   6. If the user doesn't exist, isn't ACTIVE, or isn't an admin → denied.
 *
 * This means revocation is IMMEDIATE: setting revokedAt = now() on the
 * TrustedDevice row denies all further access on the very next request,
 * even if the cookie hasn't expired.
 */
export async function getSession(): Promise<AppSession | null> {
  // 1. NextAuth session (standard login).
  const s = await getServerSession(authOptions);
  if (s?.user) return s as AppSession | null;

  // 2. Trusted-device cookie (five-tap shortcut).
  const cookieStore = await cookies();
  const token = cookieStore.get(TRUSTED_COOKIE_NAME)?.value;

  // Fast HMAC + expiry check (Edge-compatible logic, no DB yet).
  const payload = await verifyTrustedToken(token);
  if (!payload) return null;
  if (payload.role !== "ADMIN" && payload.role !== "SUPER_ADMIN") return null;

  // Full DB-backed check: revocation, user existence, role, status.
  const tokenHash = await hashToken(token!);
  const record = await db.trustedDevice.findUnique({
    where: { tokenHash },
    select: { id: true, revokedAt: true, expiresAt: true, userId: true },
  });
  if (!record) return null; // token not in DB — revoked or never issued
  if (record.revokedAt) return null; // explicitly revoked

  // Verify the admin user still exists and is active + admin.
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
    },
  });
  if (!user || user.status !== "ACTIVE") return null;
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") return null; // demoted

  // Update lastUsedAt (fire-and-forget, don't block the request).
  db.trustedDevice
    .update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return {
    user: {
      id: user.id,
      email: user.email,
      name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
      role: user.role,
    },
  } as AppSession;
}

/**
 * Require an authenticated session. In Route Handlers, pass `redirect: false`
 * to get `null` instead of a redirect (so you can return 401 JSON).
 */
export async function requireSession(
  opts: { redirect?: boolean } = {},
): Promise<AppSession | null> {
  const session = await getSession();
  if (!session) {
    if (opts.redirect === false) return null;
    redirect("/login?callbackUrl=" + encodeURIComponent("/account"));
  }
  return session;
}

/**
 * Require an admin role. Returns the session if authorized, or null if not.
 *
 * By default returns null (for Route Handlers — they check for null and
 * return 401 JSON). Pass `{ redirect: true }` for Server Components that
 * should redirect to /admin-login on failure.
 *
 * This checks the real session (NextAuth OR trusted-device + DB revocation +
 * user lookup). The trusted cookie alone does NOT bypass this — the user must
 * still exist in the DB with an active admin role, and the device must not be
 * revoked.
 */
export async function requireRole(
  role: "ADMIN" | "SUPER_ADMIN",
  opts: { redirect?: boolean } = {},
): Promise<AppSession | null> {
  const session = await getSession();
  if (!session) {
    if (opts.redirect) redirect("/admin-login");
    return null;
  }
  if (session.user.role !== role && session.user.role !== "SUPER_ADMIN") {
    if (opts.redirect) redirect("/admin-login");
    return null;
  }
  return session;
}
