import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { CategoryForm } from "@/components/site/category-form";

export default async function AdminCategoriesPage() {
  await requireRole("ADMIN");
  const categories = await db.category.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } });
  return (
    <div>
      <h1 className="font-sans text-2xl font-bold text-forest sm:text-3xl">Categories</h1>
      <p className="mt-1 text-sm text-muted-foreground">{categories.length} categories.</p>
      <div className="mt-5 max-w-md rounded-xl border border-border bg-white p-4"><CategoryForm /></div>
      <div className="mt-5 overflow-hidden rounded-xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-cream-dark/40 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Slug</th><th className="px-4 py-3">Products</th></tr></thead>
          <tbody className="divide-y divide-border">
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-cream/40">
                <td className="px-4 py-3 font-medium text-forest">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.slug}</td>
                <td className="px-4 py-3 text-muted-foreground">{c._count.products}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
