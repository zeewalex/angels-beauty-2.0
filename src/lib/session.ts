import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions, type AppSession } from "@/lib/auth";

/** Get the current session (or null) on the server. */
export async function getSession(): Promise<AppSession | null> {
  const s = await getServerSession(authOptions);
  return s as AppSession | null;
}

/**
 * Require an authenticated session. In Route Handlers, pass `redirect: false`
 * to get `null` instead of a redirect (so you can return 401 JSON). In Server
 * Components / Server Actions, it redirects to /login by default.
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

/** Require a specific role (used for admin endpoints later). */
export async function requireRole(role: "ADMIN" | "SUPER_ADMIN") {
  const session = await requireSession({ redirect: false });
  if (!session) return null;
  if (session.user.role !== role && session.user.role !== "SUPER_ADMIN") return null;
  return session;
}
