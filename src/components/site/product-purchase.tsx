"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingBag, Heart, Truck, ShieldCheck } from "lucide-react";
import { useCart } from "@/lib/cart-client";
import { useWishlist } from "@/lib/wishlist-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { CatalogProduct } from "@/lib/catalog";

function stockInfo(stock: number) {
  if (stock <= 0) return { label: "Out of Stock", color: "text-red-600", dot: "bg-red-500" };
  if (stock <= 10) return { label: `Low Stock — only ${stock} left`, color: "text-amber-600", dot: "bg-amber-500" };
  return { label: "In Stock", color: "text-forest-light", dot: "bg-forest-light" };
}

export function ProductPurchase({ product }: { product: CatalogProduct }) {
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const { addItem } = useCart();
  const { isWished, toggle: toggleWishlist } = useWishlist();
  const stock = stockInfo(product.stock);
  const outOfStock = product.stock <= 0;
  const img = product.images[0] ?? "/images/product-placeholder.svg";
  const variantId = `v-${product.id}`;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", stock.dot)} />
        <span className={cn("text-sm font-medium", stock.color)}>{stock.label}</span>
      </div>

      <div className="mt-4 flex items-baseline gap-3">
        <span className="font-serif text-4xl font-bold text-forest">
          ${product.price.toFixed(2)}
        </span>
        {product.comparePrice && (
          <span className="text-base text-muted-foreground line-through">
            ${product.comparePrice.toFixed(2)}
          </span>
        )}
      </div>

      {/* quantity + add to cart */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="inline-flex items-center rounded-full border border-border bg-white">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="inline-flex h-12 w-11 items-center justify-center rounded-l-full text-forest hover:bg-forest/5 disabled:opacity-40"
            disabled={outOfStock || qty <= 1}
            aria-label="Decrease quantity"
          >
            <Minus size={16} />
          </button>
          <span className="w-10 text-center text-sm font-semibold text-forest">{qty}</span>
          <button
            onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
            className="inline-flex h-12 w-11 items-center justify-center rounded-r-full text-forest hover:bg-forest/5 disabled:opacity-40"
            disabled={outOfStock || qty >= (product.stock || 99)}
            aria-label="Increase quantity"
          >
            <Plus size={16} />
          </button>
        </div>

        <button
          onClick={async () => {
            if (outOfStock) {
              toast.error("This item is currently out of stock.");
              return;
            }
            setAdding(true);
            const res = await addItem(variantId, qty);
            setAdding(false);
            if (res.ok) toast.success(`${qty} × ${product.name} added to cart`);
            else toast.error(res.message);
          }}
          disabled={outOfStock || adding}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-forest px-6 text-sm font-semibold text-white transition-colors hover:bg-forest-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingBag size={17} />
          {outOfStock ? "Out of Stock" : adding ? "Adding…" : "Add to Cart"}
        </button>

        <button
          onClick={async () => {
            const res = await toggleWishlist(product.id, product.name);
            if (res.guest) toast.info(res.message);
            else if (res.ok) toast.success(isWished ? "Removed from wishlist" : "Added to wishlist");
            else toast.error(res.message || "Could not update wishlist.");
          }}
          className={cn(
            "inline-flex h-12 w-12 items-center justify-center rounded-full border border-border bg-white text-forest transition-colors hover:bg-blush/10",
            isWished && "border-blush-dark text-blush-dark",
          )}
          aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={18} className={isWished ? "fill-blush-dark" : ""} />
        </button>
      </div>

      {/* trust row */}
      <div className="mt-6 grid grid-cols-1 gap-2 rounded-xl border border-border bg-white/60 p-4 sm:grid-cols-3">
        <div className="flex items-center gap-2 text-xs text-forest">
          <ShieldCheck size={16} className="text-forest-light" />
          100% Authentic
        </div>
        <div className="flex items-center gap-2 text-xs text-forest">
          <Truck size={16} className="text-forest-light" />
          {product.freeShipping ? "Free Shipping" : "Ships in 2–4 days"}
        </div>
        <div className="flex items-center gap-2 text-xs text-forest">
          <ShoppingBag size={16} className="text-forest-light" />
          Easy 30-day returns
        </div>
      </div>
    </div>
  );
}
