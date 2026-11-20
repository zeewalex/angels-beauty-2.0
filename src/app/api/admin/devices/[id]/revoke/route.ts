import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";

/**
 * POST /api/admin/devices/[id]/revoke — revoke a trusted device immediately.
 *
 * Sets revokedAt = now() on the TrustedDevice row. The very next request from
 * that device will fail the DB-backed check in getSession() — even if the
 * cookie hasn't expired. This is immediate revocation (requirement #3).
 *
 * Security: requires admin role. SUPER_ADMIN can revoke any device; ADMIN can
 * only revoke their own devices.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireRole("ADMIN");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Find the device.
  const device = await db.trustedDevice.findUnique({
    where: { id },
    select: { id: true, userId: true, revokedAt: true },
  });
  if (!device) {
    return NextResponse.json({ error: "Device not found" }, { status: 404 });
  }

  // ADMIN (not SUPER_ADMIN) can only revoke their own devices.
  if (session.user.role !== "SUPER_ADMIN" && device.userId !== session.user.id) {
    return NextResponse.json({ error: "Cannot revoke another admin's device" }, { status: 403 });
  }

  // Already revoked?
  if (device.revokedAt) {
    return NextResponse.json({ ok: true, alreadyRevoked: true });
  }

  await db.trustedDevice.update({
    where: { id },
    data: { revokedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
