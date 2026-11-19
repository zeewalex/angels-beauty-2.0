import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { errorResponse } from "@/lib/schemas";

export async function GET() {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  const messages = await db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ messages });
}
