import { NextResponse } from "next/server";
import { releaseExpiredReservations } from "@/lib/inventory";

/**
 * POST /api/cron/release-reservations
 *
 * Releases inventory reservations for PENDING orders whose reservation has
 * expired (no payment arrived within RESERVATION_TTL_MS). Marks those orders
 * CANCELLED + payment FAILED. Safe to run repeatedly (idempotent).
 *
 * In production this is called by a scheduled job (e.g. Vercel Cron). For
 * dev/testing it can be triggered manually.
 */
export async function POST() {
  const result = await releaseExpiredReservations();
  return NextResponse.json({ ok: true, ...result });
}
