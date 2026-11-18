import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/schemas";

/** GET /api/track-order?orderNumber=...&email=... — secure order lookup (requires both). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderNumber = url.searchParams.get("orderNumber")?.trim();
  const email = url.searchParams.get("email")?.trim().toLowerCase();
  if (!orderNumber || !email) return errorResponse("Order number and email are required.", 400);
  const order = await db.order.findFirst({
    where: { orderNumber, email },
    select: { orderNumber: true, status: true, paymentStatus: true, fulfillmentStatus: true, totalCents: true, createdAt: true, email: true, items: { select: { name: true, quantity: true, lineCents: true } } },
  });
  if (!order) return errorResponse("No order found matching that number and email.", 404);
  return NextResponse.json({ order });
}
