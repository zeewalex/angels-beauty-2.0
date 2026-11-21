import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/announcements — public endpoint that returns the current
 * announcement messages for the storefront announcement bar.
 *
 * Messages are stored in the StoreSetting table under key "announcements".
 * If not set, the client uses hardcoded defaults.
 */
export async function GET() {
  try {
    const setting = await db.storeSetting.findUnique({
      where: { key: "announcements" },
      select: { value: true },
    });

    if (setting?.value) {
      const messages = JSON.parse(setting.value);
      if (Array.isArray(messages)) {
        return NextResponse.json({ messages });
      }
    }
  } catch {
    // DB unavailable — fall through to defaults.
  }

  // Default messages (also used when DB is not configured, e.g. Vercel Preview).
  return NextResponse.json({
    messages: [
      { icon: "truck", text: "Free Shipping on Orders Over $50" },
      { icon: "sparkles", text: "New Season Collection Now Live" },
      { icon: "refresh", text: "Easy Returns & Exchanges" },
    ],
  });
}
