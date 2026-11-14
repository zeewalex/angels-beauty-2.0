import { ArrowRight } from "lucide-react";
import { CatalogProductCard } from "./catalog-product-card";
import { SectionLabel } from "./ui-bits";
import {
  getBestSellers,
  getFeaturedProducts,
  type CatalogProduct,
} from "@/lib/catalog";

function ProductRow({
  id,
  label,
  title,
  subtitle,
  products,
  hideStock = false,
}: {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  products: CatalogProduct[];
  hideStock?: boolean;
}) {
  return (
    <section id={id} className="bg-cream py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="max-w-xl">
            <SectionLabel>{label}</SectionLabel>
            <h2 className="mt-3 font-sans text-2xl font-bold text-forest sm:text-3xl">
              {title}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <a
            href="/shop"
            className="inline-flex items-center gap-1 text-sm font-semibold text-forest hover:text-forest-light"
          >
            View All
            <ArrowRight size={15} />
          </a>
        </div>

        <div className="no-scrollbar -mx-4 mt-7 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {products.map((p) => (
            <CatalogProductCard key={p.id} product={p} hideStock={hideStock} className="w-[68vw] shrink-0 sm:w-auto" />
          ))}
        </div>
      </div>
    </section>
  );
}

// Best Sellers: real bestSeller-flagged products (5 available → show 4)
export function BestSellers() {
  return (
    <ProductRow
      id="best-sellers"
      label="Best Sellers"
      title="Our Best Selling Products"
      subtitle="Customer favorites from across the Angels Beauty collection."
      products={getBestSellers(4)}
      hideStock
    />
  );
}

// Trending Now: real newArrival + featured products, ordered to minimize
// overlap with the Best Sellers section (distinct products first).
export function TrendingNow() {
  const bs = new Set(getBestSellers(4).map((p) => p.id));
  const distinct = getFeaturedProducts(8).filter((p) => !bs.has(p.id));
  const overlap = getFeaturedProducts(8).filter((p) => bs.has(p.id));
  const products = [...distinct, ...overlap].slice(0, 4);
  return (
    <ProductRow
      id="trending"
      label="Featured Collection"
      title="Trending Now"
      subtitle="New arrivals and featured picks from our beauty community."
      products={products}
      hideStock
    />
  );
}
