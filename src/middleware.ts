import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

/**
 * Middleware (defense-in-depth). Every protected Route Handler / Server Action
 * additionally calls requireSession()/requireRole() independently.
 *  - /account/*  → requires a session.
 *  - /admin/*    → requires role ADMIN or SUPER_ADMIN.
 */
export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const path = req.nextUrl.pathname;

  if (path.startsWith("/account")) {
    if (!token) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(path)}`, req.url));
    }
  }
  if (path.startsWith("/admin")) {
    if (!token || (token.role !== "ADMIN" && token.role !== "SUPER_ADMIN")) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent("/admin")}&error=admin_required`, req.url));
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/account/:path*", "/admin/:path*"] };
