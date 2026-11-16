"use client";

import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart-client";
import { useWishlist } from "@/lib/wishlist-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { CatalogProduct } from "@/lib/catalog";

function stockInfo(stock: number) {
  if (stock <= 0) return { label: "Out of Stock", color: "text-red-600", dot: "bg-red-500" };
  if (stock <= 10) return { label: `Low Stock (${stock})`, color: "text-amber-600", dot: "bg-amber-500" };
  return { label: "In Stock", color: "text-forest-light", dot: "bg-forest-light" };
}

export function CatalogProductCard({
  product,
  className,
  hideStock = false,
}: {
  product: CatalogProduct;
  className?: string;
  /** Hide the stock indicator (e.g. on homepage cards). Stock still shows on product detail. */
  hideStock?: boolean;
}) {
  const { addItem } = useCart();
  const { isWished, toggle: toggleWishlist } = useWishlist();
  const stock = stockInfo(product.stock);
  const img = product.images[0] ?? "/images/product-placeholder.svg";
  const variantId = `v-${product.id}`;

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-white transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(27,67,50,0.4)]",
        className,
      )}
    >
      <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-blush-tile">
        <img
          src={img}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </Link>
      <button
        onClick={async () => {
          const res = await toggleWishlist(product.id, product.name);
          if (res.guest) toast.info(res.message);
          else if (res.ok) toast.success(isWished ? "Removed from wishlist" : "Added to wishlist");
          else toast.error(res.message || "Could not update wishlist.");
        }}
        className={cn(
          "absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-forest shadow-sm backdrop-blur transition-colors hover:bg-white",
          isWished && "text-blush-dark",
        )}
        aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart size={15} className={isWished ? "fill-blush-dark" : ""} />
      </button>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <Link
          href={`/product/${product.slug}`}
          className="text-[13px] font-semibold leading-snug text-forest hover:text-forest-light"
        >
          {product.name}
        </Link>
        {!hideStock && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className={cn("h-1.5 w-1.5 rounded-full", stock.dot)} />
            <span className={cn("text-[11px] font-medium", stock.color)}>{stock.label}</span>
          </div>
        )}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-serif text-lg font-bold text-forest">
            ${product.price.toFixed(2)}
          </span>
          {product.freeShipping && (
            <span className="text-[10px] font-medium uppercase tracking-wide text-blush-dark">
              Free Ship
            </span>
          )}
        </div>
        <button
          onClick={async () => {
            if (product.stock <= 0) {
              toast.error("This item is currently out of stock.");
              return;
            }
            const res = await addItem(variantId, 1);
            if (res.ok) toast.success(`${product.name} added to cart`);
            else toast.error(res.message);
          }}
          disabled={product.stock <= 0}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-forest px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-forest-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add to Cart
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
