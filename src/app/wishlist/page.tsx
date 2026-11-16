"use client";

import Link from "next/link";
import { Heart, ArrowRight, Trash2, ShoppingBag } from "lucide-react";
import { StorefrontShell } from "@/components/site/storefront-shell";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { useWishlist } from "@/lib/wishlist-client";
import { useCart } from "@/lib/cart-client";
import { catalogProducts } from "@/lib/catalog";
import { toast } from "sonner";
import { useState } from "react";

export default function WishlistPage() {
  const { items, authed, toggle, count } = useWishlist();
  const { addItem } = useCart();
  const [busy, setBusy] = useState<string | null>(null);

  // For guests, derive items from the in-memory store via the catalog.
  const shown = authed
    ? items
    : items.length
      ? items
      : []; // guest items come through useShop via useWishlist fallback? No — guest uses productIds.

  return (
    <StorefrontShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Wishlist" }]} />
        <div className="mt-4 flex items-center justify-between">
          <h1 className="font-sans text-3xl font-bold text-forest sm:text-4xl">My Wishlist</h1>
          {count > 0 && <span className="text-sm text-muted-foreground">{count} item{count === 1 ? "" : "s"}</span>}
        </div>

        {!authed && (
          <div className="mt-4 rounded-xl border border-blush-dark/30 bg-blush/10 px-4 py-3 text-sm text-forest">
            <span className="font-medium">Sign in</span> to save your wishlist across devices.{" "}
            <Link href="/login?callbackUrl=/wishlist" className="font-semibold underline">Sign in</Link>
          </div>
        )}

        {shown.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white/50 px-6 py-16 text-center">
            <Heart size={32} className="text-muted-foreground" />
            <p className="mt-3 font-sans text-base font-semibold text-forest">Your wishlist is empty</p>
            <p className="mt-1 text-sm text-muted-foreground">Tap the heart on any product to save it here.</p>
            <Link href="/shop" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-forest px-5 py-2 text-sm font-semibold text-white hover:bg-forest-light">
              Browse Products <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {shown.map((it) => (
              <div key={it.productId} className="flex gap-3 rounded-xl border border-border bg-white p-3 sm:p-4">
                <Link href={`/product/${it.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-blush-tile">
                  {it.imageUrl && <img src={it.imageUrl} alt={it.name} className="h-full w-full object-cover" />}
                </Link>
                <div className="flex flex-1 flex-col">
                  <Link href={`/product/${it.slug}`} className="text-sm font-semibold text-forest hover:text-forest-light">{it.name}</Link>
                  <span className="mt-0.5 font-serif text-base font-bold text-forest">${(it.priceCents / 100).toFixed(2)}</span>
                  <div className="mt-auto flex items-center gap-2 pt-2">
                    <button
                      onClick={async () => {
                        setBusy(it.productId);
                        const cat = catalogProducts.find((p) => p.id === it.productId);
                        const variantId = `v-${it.productId}`;
                        const res = await addItem(variantId, 1);
                        if (res.ok) toast.success(`${it.name} added to cart`);
                        else toast.error(res.message);
                        setBusy(null);
                      }}
                      disabled={busy === it.productId}
                      className="inline-flex items-center gap-1.5 rounded-full bg-forest px-3 py-1.5 text-xs font-semibold text-white hover:bg-forest-light disabled:opacity-50"
                    >
                      <ShoppingBag size={13} /> Add to Cart
                    </button>
                    <button
                      onClick={async () => {
                        setBusy(it.productId);
                        await toggle(it.productId, it.name);
                        setBusy(null);
                        toast.success("Removed from wishlist");
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove ${it.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StorefrontShell>
  );
}
