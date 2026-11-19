import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";

export default async function AdminBlogPage() {
  await requireRole("ADMIN");
  const posts = await db.blogPost.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <div className="flex items-center justify-between">
        <div><h1 className="font-sans text-2xl font-bold text-forest sm:text-3xl">Blog</h1><p className="mt-1 text-sm text-muted-foreground">{posts.length} posts.</p></div>
      </div>
      <div className="mt-5 overflow-hidden rounded-xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-cream-dark/40 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Status</th><th className="hidden px-4 py-3 sm:table-cell">Date</th></tr></thead>
          <tbody className="divide-y divide-border">
            {posts.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No blog posts yet. Use the API to create posts.</td></tr>}
            {posts.map((p) => (
              <tr key={p.id} className="hover:bg-cream/40">
                <td className="px-4 py-3 font-medium text-forest">{p.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${p.status === "PUBLISHED" ? "bg-forest/10 text-forest" : "bg-amber-100 text-amber-700"}`}>{p.status}</span></td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
