import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { ProductActions } from "@/components/site/product-actions";

export default async function AdminProductsPage() {
  await requireRole("ADMIN");
  const products = await db.product.findMany({
    include: { category: { select: { name: true } }, variants: { include: { inventory: true }, take: 1 }, images: { where: { isPrimary: true }, take: 1 } },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans text-2xl font-bold text-forest sm:text-3xl">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">{products.length} products · soft-archive preserves historical orders.</p>
        </div>
        <Link href="/admin/products/new" className="inline-flex items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-forest-light">
          <Plus size={15} /> New
        </Link>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-cream-dark/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="hidden px-4 py-3 sm:table-cell">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="hidden px-4 py-3 sm:table-cell">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => {
              const v = p.variants[0];
              return (
                <tr key={p.id} className="hover:bg-cream/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-2 font-medium text-forest hover:text-forest-light">
                      {p.images[0] && <img src={p.images[0].url} alt="" className="h-8 w-8 rounded object-cover" />}
                      <span className="line-clamp-1">{p.name}</span>
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{p.category.name}</td>
                  <td className="px-4 py-3 font-medium text-forest">${((v?.priceCents ?? 0) / 100).toFixed(2)}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{v?.inventory?.quantity ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${p.status === "ACTIVE" ? "bg-forest/10 text-forest" : "bg-amber-100 text-amber-700"}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right"><ProductActions id={p.id} status={p.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
