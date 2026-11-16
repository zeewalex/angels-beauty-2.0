import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { errorResponse } from "@/lib/schemas";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  code: z.string().max(60).optional(),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"]),
  value: z.number().int().min(0),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  isActive: z.boolean().default(false), // must be authorized true to actually display
});

export async function GET() {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  const promotions = await db.promotion.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ promotions });
}

export async function POST(req: Request) {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid promotion.", 400);
  const { name, code, type, value, startsAt, endsAt, isActive } = parsed.data;
  if (code) {
    const dup = await db.promotion.findUnique({ where: { code } });
    if (dup) return errorResponse("Coupon code already exists.", 409);
  }
  const promo = await db.promotion.create({
    data: {
      name, code: code || null, type, value,
      isActive, // authorizedBy is set below when activating
      authorizedBy: isActive ? session.user.id : null,
      startsAt: startsAt ? new Date(startsAt) : null,
      endsAt: endsAt ? new Date(endsAt) : null,
    },
  });
  await logAudit(session, "promotion.create", "Promotion", promo.id, `Created promotion "${name}" (active=${isActive})`);
  return NextResponse.json({ ok: true, id: promo.id });
}
