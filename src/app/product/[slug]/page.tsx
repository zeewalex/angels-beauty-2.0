import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { StorefrontShell } from "@/components/site/storefront-shell";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { SectionLabel } from "@/components/site/ui-bits";
import { ProductGallery } from "@/components/site/product-gallery";
import { ProductPurchase } from "@/components/site/product-purchase";
import { CatalogProductCard } from "@/components/site/catalog-product-card";
import {
  catalogProducts,
  getCategoryBySlug,
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/catalog";

export function generateStaticParams() {
  return catalogProducts.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return params.then((p) => {
    const product = getProductBySlug(p.slug);
    if (!product) return { title: "Product — Angels Beauty" };
    return {
      title: `${product.name} — Angels Beauty`,
      description: product.description.slice(0, 155),
    };
  });
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const category = getCategoryBySlug(product.categorySlug);
  const related = getRelatedProducts(product, 4);

  return (
    <StorefrontShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
            ...(category
              ? [{ label: category.name, href: `/category/${category.slug}` }]
              : []),
            { label: product.name },
          ]}
        />

        <div className="mt-4">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:text-forest-light"
          >
            <ArrowLeft size={15} />
            Back to shop
          </Link>
        </div>

        {/* main: gallery + info */}
        <div className="mt-5 grid gap-8 lg:grid-cols-2">
          <ProductGallery images={product.images} name={product.name} />

          <div className="flex flex-col">
            {category && (
              <Link
                href={`/category/${category.slug}`}
                className="text-[11px] font-semibold uppercase tracking-wider text-blush-dark hover:text-forest"
              >
                {category.name}
              </Link>
            )}
            <h1 className="mt-2 font-sans text-2xl font-bold leading-tight text-forest sm:text-3xl">
              {product.name}
            </h1>

            {/* short description (first sentence/120 chars) */}
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {product.description.length > 180
                ? `${product.description.slice(0, 180).trim()}…`
                : product.description}
            </p>

            <div className="mt-6">
              <ProductPurchase product={product} />
            </div>
          </div>
        </div>

        {/* details */}
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {/* full description */}
          <div className="rounded-2xl border border-border bg-white p-6 lg:col-span-2">
            <SectionLabel>Description</SectionLabel>
            <h2 className="mt-3 font-sans text-xl font-bold text-forest">
              Product Details
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>

            {product.benefits.length > 0 && (
              <div className="mt-6">
                <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-forest">
                  Key Benefits
                </h3>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {product.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check size={15} className="mt-0.5 shrink-0 text-forest-light" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* side: ingredients + how to use */}
          <div className="flex flex-col gap-6">
            {product.ingredients && (
              <div className="rounded-2xl border border-border bg-white p-6">
                <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-forest">
                  Ingredients
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {product.ingredients}
                </p>
              </div>
            )}
            {product.howToUse && (
              <div className="rounded-2xl border border-border bg-white p-6">
                <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-forest">
                  How to Use
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {product.howToUse}
                </p>
              </div>
            )}
            {!product.ingredients && !product.howToUse && (
              <div className="rounded-2xl border border-dashed border-border bg-white/50 p-6 text-sm text-muted-foreground">
                Additional ingredient and usage details for this product will be
                added during catalog enrichment.
              </div>
            )}
          </div>
        </div>

        {/* related */}
        {related.length > 0 && (
          <div className="mt-12">
            <div className="flex items-end justify-between">
              <div>
                <SectionLabel>You May Also Like</SectionLabel>
                <h2 className="mt-3 font-sans text-xl font-bold text-forest sm:text-2xl">
                  Related Products
                </h2>
              </div>
              {category && (
                <Link
                  href={`/category/${category.slug}`}
                  className="hidden text-sm font-semibold text-forest hover:text-forest-light sm:inline"
                >
                  View all in {category.name}
                </Link>
              )}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {related.map((p) => (
                <CatalogProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </StorefrontShell>
  );
}
