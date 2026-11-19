import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";

export default async function AdminPagesPage() {
  await requireRole("ADMIN");
  const pages = await db.page.findMany({ orderBy: { title: "asc" } });
  return (
    <div>
      <h1 className="font-sans text-2xl font-bold text-forest sm:text-3xl">Pages & Policies</h1>
      <p className="mt-1 text-sm text-muted-foreground">{pages.length} pages. Click to edit.</p>
      <div className="mt-5 overflow-hidden rounded-xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-cream-dark/40 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Slug</th><th className="px-4 py-3">Published</th></tr></thead>
          <tbody className="divide-y divide-border">
            {pages.map((p) => (
              <tr key={p.id} className="hover:bg-cream/40">
                <td className="px-4 py-3"><Link href={`/admin/pages/${p.slug}`} className="font-medium text-forest hover:text-forest-light">{p.title}</Link></td>
                <td className="px-4 py-3 text-muted-foreground">/{p.slug}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${p.published ? "bg-forest/10 text-forest" : "bg-amber-100 text-amber-700"}`}>{p.published ? "Published" : "Draft"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
