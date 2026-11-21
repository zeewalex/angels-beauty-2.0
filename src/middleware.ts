import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { verifyTrustedToken, TRUSTED_COOKIE_NAME } from "@/lib/trusted-device";

/**
 * Middleware — defense-in-depth edge authorization.
 *
 * Admin access model:
 *   The five-tap logo shortcut is the ONLY visible way to reach /admin from
 *   the storefront. There is no public admin login link. A device must have
 *   EITHER:
 *     (a) a valid NextAuth admin session cookie, OR
 *     (b) a valid trusted-device cookie (issued once via /admin-login after
 *         email + password + PIN verification)
 *   to access /admin. Otherwise the request is sent to /admin-login (the
 *   PIN-gated enrollment page), NOT the public /login page.
 *
 * Routes:
 *   /account/*    → requires any NextAuth session.
 *   /admin/*      → requires admin session OR trusted-device cookie.
 *   /admin-login  → always accessible (the enrollment page); if already
 *                   trusted, redirects to /admin.
 *   /login        → if callbackUrl=/admin, redirect to /admin-login (so the
 *                   public login page is never used for admin access).
 *
 * NOTE: This middleware is the EDGE check only. Every admin Route Handler
 * independently calls requireRole("ADMIN"), and the admin layout Server
 * Component calls requireRole("ADMIN") on every render. The trusted cookie
 * alone does NOT satisfy those server-side checks — it only allows the /admin
 * page to render. See src/lib/session.ts + src/app/admin/layout.tsx.
 */
export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // ── /account: requires a session ──
  if (path.startsWith("/account")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(path)}`, req.url));
    }
    return NextResponse.next();
  }

  // ── /admin-login: if already trusted, skip to /admin ──
  if (path === "/admin-login") {
    const trustedCookie = req.cookies.get(TRUSTED_COOKIE_NAME)?.value;
    const trusted = await verifyTrustedToken(trustedCookie);
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const isAdmin =
      trusted?.role === "ADMIN" || trusted?.role === "SUPER_ADMIN" ||
      token?.role === "ADMIN" || token?.role === "SUPER_ADMIN";
    if (isAdmin) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next(); // show the enrollment page
  }

  // ── /login: never use the public login page for admin access ──
  if (path === "/login") {
    const cb = req.nextUrl.searchParams.get("callbackUrl") || "";
    if (cb.startsWith("/admin")) {
      // Send to the PIN-gated admin login instead.
      return NextResponse.redirect(new URL("/admin-login", req.url));
    }
    return NextResponse.next();
  }

  // ── /admin/*: require admin session OR trusted device ──
  if (path.startsWith("/admin")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const trustedCookie = req.cookies.get(TRUSTED_COOKIE_NAME)?.value;
    const trusted = await verifyTrustedToken(trustedCookie);

    const hasAdminSession = token?.role === "ADMIN" || token?.role === "SUPER_ADMIN";
    const hasTrustedDevice =
      trusted?.role === "ADMIN" || trusted?.role === "SUPER_ADMIN";

    if (!hasAdminSession && !hasTrustedDevice) {
      // Not authorized → send to the PIN-gated enrollment page, NOT /login.
      return NextResponse.redirect(new URL("/admin-login", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: ["/account/:path*", "/admin/:path*", "/admin-login", "/login"],
};
