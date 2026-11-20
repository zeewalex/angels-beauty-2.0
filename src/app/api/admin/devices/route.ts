import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";

/**
 * GET /api/admin/devices — list all trusted devices for the admin dashboard.
 *
 * Returns devices for the currently authenticated admin, including revocation
 * status, creation date, expiry, last-used, and user-agent (for identification).
 *
 * Security: requires admin role. The requireRole() call does a full DB-backed
 * session check (NextAuth OR trusted-device + revocation + user lookup).
 */
export async function GET() {
  const session = await requireRole("ADMIN");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Admins can see all trusted devices (for store management). SUPER_ADMIN
  // sees everything; ADMIN sees their own devices.
  const where =
    session.user.role === "SUPER_ADMIN"
      ? {}
      : { userId: session.user.id };

  const devices = await db.trustedDevice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userId: true,
      userAgent: true,
      ipAddress: true,
      createdAt: true,
      expiresAt: true,
      revokedAt: true,
      lastUsedAt: true,
      user: {
        select: { email: true, firstName: true, lastName: true },
      },
    },
    take: 100,
  });

  return NextResponse.json({
    devices: devices.map((d) => ({
      id: d.id,
      userEmail: d.user.email,
      userName: [d.user.firstName, d.user.lastName].filter(Boolean).join(" "),
      userAgent: d.userAgent,
      ipAddress: d.ipAddress,
      createdAt: d.createdAt,
      expiresAt: d.expiresAt,
      revokedAt: d.revokedAt,
      lastUsedAt: d.lastUsedAt,
      status: d.revokedAt
        ? "revoked"
        : d.expiresAt < new Date()
          ? "expired"
          : "active",
    })),
  });
}
