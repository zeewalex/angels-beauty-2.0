"use client";

import { Heart, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { StarRating } from "./ui-bits";
import { useShop } from "@/lib/shop-store";
import { toast } from "sonner";
import type { DemoProduct } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  className,
}: {
  product: DemoProduct;
  className?: string;
}) {
  const addToCart = useShop((s) => s.addToCart);
  const toggleWishlist = useShop((s) => s.toggleWishlist);
  const isWished = useShop((s) => s.wishlist.includes(product.id));

  const discount = Math.round(
    ((product.compareAt - product.price) / product.compareAt) * 100,
  );

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-white transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(27,67,50,0.4)]",
        className,
      )}
    >
      {/* image tile */}
      <div className="relative aspect-square overflow-hidden bg-blush-tile">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* stacked badges (top-left) so they never overlap */}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.badge && (
            <span className="rounded-full bg-forest px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
              {product.badge}
            </span>
          )}
          {discount > 0 && (
            <span className="rounded-full bg-blush-dark px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
              -{discount}%
            </span>
          )}
        </div>
        <button
          onClick={() => {
            toggleWishlist(product.id);
            toast.success(
              isWished ? "Removed from wishlist" : "Added to wishlist",
            );
          }}
          className={cn(
            "absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-forest shadow-sm backdrop-blur transition-colors hover:bg-white",
            isWished && "text-blush-dark",
          )}
          aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={15} className={isWished ? "fill-blush-dark" : ""} />
        </button>
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {product.category}
        </p>
        <Link
          href="#"
          className="mt-0.5 text-[13px] font-semibold leading-snug text-forest hover:text-forest-light"
        >
          {product.name}
        </Link>
        <StarRating
          rating={product.rating}
          count={product.reviewCount}
          className="mt-1.5"
        />
        <div className="mt-2 flex items-center gap-2">
          <span className="font-serif text-lg font-bold text-forest">
            ${product.price.toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground line-through">
            ${product.compareAt.toFixed(2)}
          </span>
        </div>
        <button
          onClick={() => {
            addToCart({
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image,
            });
            toast.success(`${product.name} added to cart`, {
              description: `${cartMsg(product.price)}`,
              icon: <Check size={16} className="text-forest" />,
            });
          }}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-forest px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-forest-light"
        >
          Add to Cart
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

function cartMsg(price: number) {
  return `Item total $${price.toFixed(2)} — review your bag at checkout.`;
}
