/**
 * CSRF protection for admin Route Handlers (POST/PATCH/PUT/DELETE).
 *
 * The NextAuth session cookie is SameSite=Lax, which mitigates CSRF for
 * top-level navigations. For mutating fetch calls from the admin UI, we
 * additionally verify the `Origin` header matches the site's own origin.
 * A cross-site form/fetch cannot forge the Origin header.
 */
const ALLOWED_ORIGIN = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export function checkOrigin(req: Request): boolean {
  if (process.env.NODE_ENV === "production") {
    const origin = req.headers.get("origin");
    return origin === ALLOWED_ORIGIN;
  }
  // In dev, allow requests with no Origin (e.g. curl) for testing, but still
  // reject clearly cross-site origins.
  const origin = req.headers.get("origin");
  if (!origin) return true;
  return origin === ALLOWED_ORIGIN;
}
