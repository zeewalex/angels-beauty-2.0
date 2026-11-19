import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/schemas";

/** Simple in-memory rate limiter (per IP, 5 lookups per minute). */
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 1000;

function checkRate(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

/** GET /api/track-order?orderNumber=...&email=... — secure order lookup.
 * Rate-limited (5/min per IP). Requires both order number AND email.
 * Does not reveal whether an order number exists without the matching email. */
export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!checkRate(ip)) {
    return errorResponse("Too many lookup attempts. Please wait a minute and try again.", 429);
  }
  const url = new URL(req.url);
  const orderNumber = url.searchParams.get("orderNumber")?.trim();
  const email = url.searchParams.get("email")?.trim().toLowerCase();
  if (!orderNumber || !email) return errorResponse("Order number and email are required.", 400);
  // Always return the same error shape whether the order doesn't exist or the email
  // doesn't match — prevents enumeration of order numbers.
  const order = await db.order.findFirst({
    where: { orderNumber, email },
    select: { orderNumber: true, status: true, paymentStatus: true, fulfillmentStatus: true, totalCents: true, createdAt: true, email: true, items: { select: { name: true, quantity: true, lineCents: true } } },
  });
  if (!order) return errorResponse("No order found matching that number and email.", 404);
  return NextResponse.json({ order });
}
