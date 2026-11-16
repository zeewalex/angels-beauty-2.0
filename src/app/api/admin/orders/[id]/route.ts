import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { errorResponse } from "@/lib/schemas";

const patchSchema = z.object({
  fulfillmentStatus: z.enum(["UNFULFILLED", "PARTIAL", "FULFILLED"]).optional(),
  notes: z.string().max(2000).optional(),
  // paymentStatus is intentionally NOT accepted here — payment status only
  // changes via a verified payment result (Phase 3 webhook / dev simulate).
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: { items: true, payments: true, shipments: true, shippingAddress: true, billingAddress: true },
  });
  if (!order) return errorResponse("Order not found.", 404);
  return NextResponse.json({ order });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid data.", 400);
  const existing = await db.order.findUnique({ where: { id }, select: { orderNumber: true } });
  if (!existing) return errorResponse("Order not found.", 404);
  await db.order.update({ where: { id }, data: parsed.data });
  await logAudit(session, "order.update", "Order", id, `Updated fulfillment for ${existing.orderNumber}`);
  return NextResponse.json({ ok: true });
}
