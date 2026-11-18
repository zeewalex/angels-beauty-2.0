import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/schemas";

const schema = z.object({ name: z.string().min(1).max(100), email: z.string().email(), subject: z.string().min(1).max(200), message: z.string().min(1).max(5000) });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("Please fill in all fields correctly.", 400);
  if (/https?:\/\//i.test(parsed.data.message) && parsed.data.message.length < 50) {
    return errorResponse("Message flagged as potential spam.", 400);
  }
  await db.contactMessage.create({ data: parsed.data });
  return NextResponse.json({ ok: true });
}
