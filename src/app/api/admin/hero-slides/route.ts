import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { checkOrigin } from "@/lib/csrf";
import { errorResponse } from "@/lib/schemas";

const schema = z.object({
  mediaType: z.enum(["image", "video"]).default("image"),
  desktopMedia: z.string().min(1),
  mobileMedia: z.string().optional(),
  posterImage: z.string().optional(),
  headline: z.string().max(200).optional(),
  subtitle: z.string().max(500).optional(),
  ctaText: z.string().max(100).optional(),
  ctaUrl: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

export async function GET() {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  const slides = await db.heroSlide.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ slides });
}

export async function POST(req: Request) {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  if (!checkOrigin(req)) return errorResponse("Forbidden (CSRF).", 403);
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid slide data.", 400);
  const slide = await db.heroSlide.create({
    data: {
      ...parsed.data,
      startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : null,
      endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
    },
  });
  await logAudit(session, "heroslide.create", "HeroSlide", slide.id, `Created hero slide`);
  return NextResponse.json({ ok: true, id: slide.id });
}
