import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { BlogEditor } from "@/components/site/blog-editor";

export default async function NewBlogPostPage() {
  await requireRole("ADMIN");
  return <BlogEditor />;
}
