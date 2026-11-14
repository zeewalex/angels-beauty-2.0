import { ArrowRight } from "lucide-react";
import { demoBestSellers, demoTrending, type DemoProduct } from "@/lib/demo-data";
import { SectionLabel } from "./ui-bits";
import { DemoBadge } from "./demo-badge";
import { ProductCard } from "./product-card";

function ProductRow({
  id,
  label,
  title,
  subtitle,
  products,
}: {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  products: DemoProduct[];
}) {
  return (
    <section id={id} className="bg-cream py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="max-w-xl">
            <SectionLabel>{label}</SectionLabel>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <h2 className="font-sans text-2xl font-bold text-forest sm:text-3xl">
                {title}
              </h2>
              <DemoBadge />
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <a
            href="#shop"
            className="inline-flex items-center gap-1 text-sm font-semibold text-forest hover:text-forest-light"
          >
            View All
            <ArrowRight size={15} />
          </a>
        </div>

        <div className="no-scrollbar -mx-4 mt-7 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              className="w-[68vw] shrink-0 sm:w-auto"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function BestSellers() {
  return (
    <ProductRow
      id="best-sellers"
      label="Best Sellers"
      title="Our Best Selling Products"
      subtitle="Loved by thousands. Perfect for your daily beauty routine."
      products={demoBestSellers}
    />
  );
}

export function TrendingNow() {
  return (
    <ProductRow
      id="trending"
      label="Featured Collection"
      title="Trending Now"
      subtitle="Discover what's hot and loved by our beauty community."
      products={demoTrending}
    />
  );
}
