import { NextResponse } from "next/server";
import { releaseExpiredReservations } from "@/lib/inventory";
import { errorResponse } from "@/lib/schemas";

/**
 * POST /api/cron/release-reservations
 *
 * Releases expired inventory reservations (PENDING orders past their
 * reservationExpiresAt). Safe to run repeatedly (idempotent).
 *
 * AUTHENTICATED: requires a valid `x-cron-secret` header matching
 * process.env.CRON_SECRET. In production this is called by a scheduled job
 * (e.g. Vercel Cron) that supplies the secret.
 */
export async function POST(req: Request) {
  const provided = req.headers.get("x-cron-secret");
  const expected = process.env.CRON_SECRET;
  if (!expected || provided !== expected) {
    return errorResponse("Unauthorized.", 401);
  }
  const result = await releaseExpiredReservations();
  return NextResponse.json({ ok: true, ...result });
}
