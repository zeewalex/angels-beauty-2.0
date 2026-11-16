import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { ProductEditor } from "@/components/site/product-editor";
import { ProductActions } from "@/components/site/product-actions";

export default async function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;
  const product = await db.product.findUnique({
    where: { id },
    include: { variants: { include: { inventory: true } }, images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!product) notFound();
  const categories = await db.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <a href="/admin/products" className="text-xs font-medium text-muted-foreground hover:text-forest">← Products</a>
          <h1 className="mt-1 font-sans text-2xl font-bold text-forest">{product.name}</h1>
          <p className="text-sm text-muted-foreground">slug: {product.slug} · {product.status}</p>
        </div>
        <ProductActions id={product.id} status={product.status} />
      </div>
      <div className="mt-6">
        <ProductEditor product={product} categories={categories} />
      </div>
    </div>
  );
}
