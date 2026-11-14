import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StorefrontShell } from "@/components/site/storefront-shell";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { SectionLabel } from "@/components/site/ui-bits";
import { CatalogProductCard } from "@/components/site/catalog-product-card";
import {
  catalogCategories,
  catalogProducts,
  getCategoryBySlug,
  getProductsByCategory,
} from "@/lib/catalog";

export function generateStaticParams() {
  return catalogCategories.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  // params is async in Next 16; resolve synchronously-friendly via then
  return params.then((p) => {
    const cat = getCategoryBySlug(p.slug);
    if (!cat) return { title: "Category — Angels Beauty" };
    return {
      title: `${cat.name} — Angels Beauty`,
      description: `Shop ${cat.count} ${cat.name.toLowerCase()} products from Angels Beauty.`,
    };
  });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const products = getProductsByCategory(slug);
  const sorted = [...products].sort(
    (a, b) =>
      Number(b.featured) - Number(a.featured) ||
      Number(b.bestSeller) - Number(a.bestSeller) ||
      a.name.localeCompare(b.name),
  );

  return (
    <StorefrontShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
            { label: category.name },
          ]}
        />

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <SectionLabel>Category</SectionLabel>
            <h1 className="mt-3 font-sans text-3xl font-bold text-forest sm:text-4xl">
              {category.name}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {category.count} product{category.count === 1 ? "" : "s"} in this collection.
            </p>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:text-forest-light"
          >
            <ArrowLeft size={15} />
            Back to all products
          </Link>
        </div>

        {sorted.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {sorted.map((p) => (
              <CatalogProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="mt-10 text-sm text-muted-foreground">No products in this category yet.</p>
        )}

        {/* other categories */}
        <div className="mt-12 border-t border-border pt-8">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Browse other categories
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {catalogCategories
              .filter((c) => c.slug !== slug)
              .map((c) => (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  className="shrink-0 rounded-full border border-border bg-white px-4 py-1.5 text-xs font-semibold text-forest transition-colors hover:border-forest/40 hover:bg-forest/5"
                >
                  {c.name} ({c.count})
                </Link>
              ))}
          </div>
        </div>
      </div>
    </StorefrontShell>
  );
}
