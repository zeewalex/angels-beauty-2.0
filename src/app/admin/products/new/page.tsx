import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { NewProductForm } from "@/components/site/new-product-form";

export default async function NewProductPage() {
  await requireRole("ADMIN");
  const categories = await db.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } });
  return (
    <div>
      <a href="/admin/products" className="text-xs font-medium text-muted-foreground hover:text-forest">← Products</a>
      <h1 className="mt-1 font-sans text-2xl font-bold text-forest">New Product</h1>
      <div className="mt-5"><NewProductForm categories={categories} /></div>
    </div>
  );
}
