import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { checkOrigin } from "@/lib/csrf";
import { errorResponse } from "@/lib/schemas";

const schema = z.object({
  contact_email: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_address: z.string().optional(),
  business_hours: z.string().optional(),
}).strict();

export async function GET() {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  const settings = await db.storeSetting.findMany({ where: { key: { startsWith: "contact_" } } });
  const result: Record<string, string> = {};
  for (const s of settings) result[s.key] = s.value;
  return NextResponse.json({ settings: result });
}

export async function POST(req: Request) {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  if (!checkOrigin(req)) return errorResponse("Forbidden (CSRF).", 403);
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid data.", 400);
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) {
      await db.storeSetting.upsert({
        where: { key },
        create: { key, value: String(value) },
        update: { value: String(value) },
      });
    }
  }
  return NextResponse.json({ ok: true });
}
