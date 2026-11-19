import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { checkOrigin } from "@/lib/csrf";
import { errorResponse } from "@/lib/schemas";

const schema = z.object({
  category: z.string().default("General"),
  question: z.string().min(1),
  answer: z.string().min(1),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  const faqs = await db.fAQ.findMany({ orderBy: [{ sortOrder: "asc" }, { question: "asc" }] });
  return NextResponse.json({ faqs });
}

export async function POST(req: Request) {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  if (!checkOrigin(req)) return errorResponse("Forbidden (CSRF).", 403);
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid FAQ data.", 400);
  const faq = await db.fAQ.create({ data: parsed.data });
  await logAudit(session, "faq.create", "FAQ", faq.id, `Created FAQ`);
  return NextResponse.json({ ok: true, id: faq.id });
}
