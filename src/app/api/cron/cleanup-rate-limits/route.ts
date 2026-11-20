import { NextResponse } from "next/server";
import { cleanupExpiredRateLimits } from "@/lib/rate-limit";

/**
 * GET /api/cron/cleanup-rate-limits — hourly cleanup of expired rate-limit rows.
 *
 * Called by Vercel Cron (see vercel.json). Requires CRON_SECRET for auth:
 *   Headers: { Authorization: Bearer <CRON_SECRET> }
 *
 * This prevents the RateLimitBucket table from growing indefinitely.
 * Safe to call on any instance — uses DELETE WHERE expiresAt < now().
 */
export async function GET(req: Request) {
  // Verify the CRON_SECRET to prevent unauthorized invocation.
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const deleted = await cleanupExpiredRateLimits();
    return NextResponse.json({ ok: true, deleted });
  } catch (err) {
    console.error("[cron] cleanup-rate-limits failed:", err);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
