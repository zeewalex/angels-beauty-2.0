import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { checkOrigin } from "@/lib/csrf";
import { errorResponse } from "@/lib/schemas";

const schema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).optional(),
  excerpt: z.string().optional(),
  body: z.string(),
  featuredImage: z.string().optional(),
  category: z.string().default("General"),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED"]).default("DRAFT"),
  publishedAt: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export async function GET() {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  const posts = await db.blogPost.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  if (!checkOrigin(req)) return errorResponse("Forbidden (CSRF).", 403);
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid post data.", 400);
  const finalSlug = parsed.data.slug || parsed.data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const post = await db.blogPost.create({
    data: { ...parsed.data, slug: finalSlug, publishedAt: parsed.data.publishedAt ? new Date(parsed.data.publishedAt) : null },
  });
  await logAudit(session, "blog.create", "BlogPost", post.id, `Created blog post "${parsed.data.title}"`);
  return NextResponse.json({ ok: true, id: post.id });
}
