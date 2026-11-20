import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyTrustedToken, TRUSTED_COOKIE_NAME } from "@/lib/trusted-device";

/**
 * GET /api/admin/device-status — lightweight check used by the five-tap
 * logo shortcut to decide where to send the client:
 *   - { trusted: true }  → device has a valid admin session OR trusted cookie
 *   - { trusted: false } → not trusted; five-tap should route to /admin-login
 *
 * This endpoint does NOT grant any access — it's informational only. The
 * middleware + admin layout enforce real authorization on /admin itself.
 */
export async function GET() {
  // 1. Is there a valid NextAuth admin session? (covers the case where the
  //    user logged in via the standard login page this session).
  const session = await getServerSession(authOptions);
  if (session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN") {
    return NextResponse.json({ trusted: true, reason: "session" });
  }

  // 2. Is there a valid trusted-device cookie?
  const cookieStore = await cookies();
  const token = cookieStore.get(TRUSTED_COOKIE_NAME)?.value;
  const trusted = await verifyTrustedToken(token);
  if (trusted && (trusted.role === "ADMIN" || trusted.role === "SUPER_ADMIN")) {
    return NextResponse.json({ trusted: true, reason: "device" });
  }

  return NextResponse.json({ trusted: false });
}
