"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { StorefrontShell } from "@/components/site/storefront-shell";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { SectionLabel } from "@/components/site/ui-bits";
import { CatalogProductCard } from "@/components/site/catalog-product-card";
import { catalogProducts, catalogCategories } from "@/lib/catalog";
import { cn } from "@/lib/utils";

type SortKey = "featured" | "price-asc" | "price-desc" | "name" | "newest";
const PAGE_SIZE = 12;

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name", label: "Name: A–Z" },
  { value: "newest", label: "Newest" },
];

export default function ShopPage() {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("featured");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    let list = catalogProducts;
    if (activeCat !== "all") list = list.filter((p) => p.categorySlug === activeCat);
    const q = query.trim().toLowerCase();
    if (q)
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.categorySlug.toLowerCase().includes(q),
      );
    const sorted = [...list];
    switch (sort) {
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
        sorted.sort((a, b) => (b.createdAt < a.createdAt ? -1 : b.createdAt > a.createdAt ? 1 : 0));
        break;
      case "featured":
      default:
        sorted.sort(
          (a, b) => Number(b.featured) - Number(a.featured) || Number(b.bestSeller) - Number(a.bestSeller),
        );
    }
    return sorted;
  }, [activeCat, query, sort]);

  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;
  const resetPagination = () => setVisible(PAGE_SIZE);

  return (
    <StorefrontShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shop" }]} />

        <div className="mt-4">
          <SectionLabel>All Products</SectionLabel>
          <h1 className="mt-3 font-sans text-3xl font-bold text-forest sm:text-4xl">
            Shop All Products
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Browse our full collection of {catalogProducts.length} authentic beauty products
            across {catalogCategories.length} categories.
          </p>
        </div>

        {/* Filter + search bar */}
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-white/70 p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  resetPagination();
                }}
                placeholder="Search products, ingredients, categories..."
                className="h-11 w-full rounded-full border border-border bg-white pl-10 pr-9 text-sm text-forest placeholder:text-muted-foreground focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
                aria-label="Search products"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    resetPagination();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-forest"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={15} className="text-muted-foreground" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="h-11 rounded-full border border-border bg-white px-4 text-sm text-forest focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
                aria-label="Sort products"
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 py-0.5">
            <button
              onClick={() => {
                setActiveCat("all");
                resetPagination();
              }}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors",
                activeCat === "all"
                  ? "border-forest bg-forest text-white"
                  : "border-border bg-white text-forest hover:border-forest/40",
              )}
            >
              All ({catalogProducts.length})
            </button>
            {catalogCategories.map((c) => (
              <button
                key={c.slug}
                onClick={() => {
                  setActiveCat(c.slug);
                  resetPagination();
                }}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors",
                  activeCat === c.slug
                    ? "border-forest bg-forest text-white"
                    : "border-border bg-white text-forest hover:border-forest/40",
                )}
              >
                {c.name} ({c.count})
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filtered.length === catalogProducts.length
              ? `${filtered.length} products`
              : `${filtered.length} result${filtered.length === 1 ? "" : "s"}`}
            {activeCat !== "all" &&
              ` in ${catalogCategories.find((c) => c.slug === activeCat)?.name}`}
          </p>
        </div>

        {shown.length > 0 ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {shown.map((p) => (
              <CatalogProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white/50 px-6 py-16 text-center">
            <Search size={28} className="text-muted-foreground" />
            <p className="mt-3 font-sans text-base font-semibold text-forest">No products found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different search term or category.
            </p>
            <button
              onClick={() => {
                setQuery("");
                setActiveCat("all");
                resetPagination();
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-forest px-5 py-2 text-sm font-semibold text-white hover:bg-forest-light"
            >
              Clear filters
            </button>
          </div>
        )}

        {hasMore && shown.length > 0 && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
              className="inline-flex items-center gap-2 rounded-full border border-forest/30 bg-white px-7 py-3 text-sm font-semibold text-forest transition-colors hover:bg-forest hover:text-white"
            >
              Load More
              <span className="text-xs font-normal opacity-70">
                ({filtered.length - shown.length} remaining)
              </span>
            </button>
          </div>
        )}
      </div>
    </StorefrontShell>
  );
}
