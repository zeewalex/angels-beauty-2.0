import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { authOptions, type AppSession } from "@/lib/auth";
import {
  verifyTrustedToken,
  TRUSTED_COOKIE_NAME,
} from "@/lib/trusted-device";

/**
 * Get the current session (or null) on the server.
 *
 * Tries NextAuth first. If no NextAuth session, checks for a trusted-device
 * cookie. If the trusted cookie is valid, looks up the admin user from the DB
 * and returns a synthetic session. This lets a trusted device access /admin
 * pages without a separate NextAuth login, while still enforcing that the
 * underlying user exists, is ACTIVE, and has an admin role.
 */
export async function getSession(): Promise<AppSession | null> {
  // 1. NextAuth session (standard login).
  const s = await getServerSession(authOptions);
  if (s?.user) return s as AppSession | null;

  // 2. Trusted-device cookie (five-tap shortcut).
  const cookieStore = await cookies();
  const token = cookieStore.get(TRUSTED_COOKIE_NAME)?.value;
  const trusted = await verifyTrustedToken(token);
  if (!trusted) return null;

  // Verify the admin user still exists and is active + admin.
  const user = await db.user.findUnique({
    where: { id: trusted.userId },
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
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") return null;

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
 *
 * For admin pages, redirects to /admin-login (the PIN-gated enrollment page)
 * instead of the public /login page — so admin access never exposes the
 * public login form.
 */
export async function requireSession(
  opts: { redirect?: boolean; admin?: boolean } = {},
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
 * IMPORTANT: This checks the real session (NextAuth OR trusted-device + DB
 * lookup). The trusted cookie alone does NOT bypass this — the user must
 * still exist in the DB with an active admin role. If the user is deleted or
 * demoted after the cookie was issued, this check fails and access is denied.
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
