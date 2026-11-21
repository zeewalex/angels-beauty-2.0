import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";

/**
 * GET /api/admin/announcements — returns the current announcement messages.
 * PUT /api/admin/announcements — updates the announcement messages.
 *
 * Requires admin role. Messages are stored in StoreSetting under key
 * "announcements" as a JSON array of { icon, text } objects.
 *
 * Valid icons: truck, sparkles, refresh, tag
 * Max messages: 5
 * Max text length: 100 characters
 */

const messageSchema = z.object({
  icon: z.enum(["truck", "sparkles", "refresh", "tag"]),
  text: z.string().min(1).max(100),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(5),
});

export async function GET() {
  const session = await requireRole("ADMIN");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const setting = await db.storeSetting.findUnique({
    where: { key: "announcements" },
    select: { value: true, updatedAt: true },
  });

  if (setting?.value) {
    try {
      const messages = JSON.parse(setting.value);
      return NextResponse.json({ messages, updatedAt: setting.updatedAt });
    } catch {
      // Fall through to defaults.
    }
  }

  return NextResponse.json({
    messages: [
      { icon: "truck", text: "Free Shipping on Orders Over $50" },
      { icon: "sparkles", text: "New Season Collection Now Live" },
      { icon: "refresh", text: "Easy Returns & Exchanges" },
    ],
    updatedAt: null,
  });
}

export async function PUT(req: Request) {
  const session = await requireRole("ADMIN");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let parsed;
  try {
    const json = await req.json();
    parsed = bodySchema.safeParse(json);
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid request." },
      { status: 400 },
    );
  }

  const value = JSON.stringify(parsed.data.messages);

  const setting = await db.storeSetting.upsert({
    where: { key: "announcements" },
    update: { value },
    create: { key: "announcements", value },
  });

  return NextResponse.json({ ok: true, updatedAt: setting.updatedAt });
}
