"use client";

import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import { catalogCategories, getProductsByCategory } from "@/lib/catalog";
import { SectionLabel } from "./ui-bits";

// Top 5 categories by product count, with a representative product image
// (featured product first, else the first product in the category).
const topCategories = [...catalogCategories]
  .sort((a, b) => b.count - a.count)
  .slice(0, 5)
  .map((cat) => {
    const prods = getProductsByCategory(cat.slug);
    const rep =
      prods.find((p) => p.featured) ?? prods.find((p) => p.bestSeller) ?? prods[0];
    return { cat, image: rep?.images[0] ?? "/images/product-placeholder.svg", repName: rep?.name };
  });

export function ShopByCategory() {
  return (
    <section id="categories" className="bg-cream py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <SectionLabel>Top Categories</SectionLabel>
            <h2 className="mt-3 font-sans text-2xl font-bold text-forest sm:text-3xl">
              Shop by Category
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1 text-sm font-semibold text-forest hover:text-forest-light"
          >
            Explore All
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="no-scrollbar -mx-4 mt-7 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-5">
          {topCategories.map(({ cat, image }) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className={`group relative flex shrink-0 snap-start flex-col overflow-hidden rounded-xl ${cat.tileBg} p-4 transition-transform hover:-translate-y-1 sm:w-auto`}
              style={{ width: "min(70vw, 220px)" }}
            >
              <span
                className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-forest backdrop-blur"
                aria-hidden="true"
              >
                <Heart size={15} />
              </span>
              <div className="relative aspect-square overflow-hidden rounded-lg bg-white/40">
                <img
                  src={image}
                  alt={cat.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="font-sans text-base font-bold text-forest">{cat.name}</p>
                  <p className="text-[11px] text-forest/60">{cat.count} products</p>
                </div>
                <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-forest">
                  Shop
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
