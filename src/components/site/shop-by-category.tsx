"use client";

import { Heart, ArrowRight } from "lucide-react";
import { demoCategories } from "@/lib/demo-data";
import { SectionLabel } from "./ui-bits";
import { DemoBadge } from "./demo-badge";

export function ShopByCategory() {
  return (
    <section id="categories" className="bg-cream py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <SectionLabel>Top Categories</SectionLabel>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-2xl font-bold text-forest sm:text-3xl">
                Shop by Category
              </h2>
              <DemoBadge />
            </div>
          </div>
          <a
            href="#shop"
            className="inline-flex items-center gap-1 text-sm font-semibold text-forest hover:text-forest-light"
          >
            Explore All
            <ArrowRight size={15} />
          </a>
        </div>

        {/* horizontal scroll on mobile, grid on larger */}
        <div className="no-scrollbar -mx-4 mt-7 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-5">
          {demoCategories.map((cat) => (
            <a
              key={cat.id}
              href="#shop"
              className={`group relative flex shrink-0 snap-start flex-col overflow-hidden rounded-xl ${cat.bg} p-4 transition-transform hover:-translate-y-1 sm:w-auto`}
              style={{ width: "min(70vw, 220px)" }}
            >
              <button
                className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-forest backdrop-blur transition-colors hover:bg-white"
                aria-label={`Wishlist ${cat.name}`}
                onClick={(e) => e.preventDefault()}
              >
                <Heart size={15} />
              </button>
              <div className="relative aspect-square overflow-hidden rounded-lg">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="font-serif text-base font-bold text-forest">
                    {cat.name}
                  </p>
                  <p className="text-[11px] text-forest/60">{cat.count}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-forest">
                  Shop
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
