import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { BlogEditor } from "@/components/site/blog-editor";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;
  const post = await db.blogPost.findUnique({ where: { id } });
  if (!post) notFound();
  const serialized = { ...post, publishedAt: post.publishedAt?.toISOString() ?? null };
  return <BlogEditor post={serialized} />;
}
