"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { StorefrontShell } from "@/components/site/storefront-shell";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { useCart } from "@/lib/cart-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CartPage() {
  const { cart, loading, updateItem, removeItem } = useCart();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function onQty(id: string, qty: number) {
    setBusyId(id);
    const err = await updateItem(id, qty);
    if (err) toast.error(err);
    setBusyId(null);
  }

  async function onRemove(id: string, name: string) {
    setBusyId(id);
    await removeItem(id);
    toast.success(`${name} removed from cart`);
    setBusyId(null);
  }

  const items = cart.items;
  const empty = items.length === 0;

  return (
    <StorefrontShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Cart" }]} />
        <h1 className="mt-4 font-sans text-3xl font-bold text-forest sm:text-4xl">Shopping Cart</h1>

        {empty ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white/50 px-6 py-16 text-center">
            <ShoppingBag size={32} className="text-muted-foreground" />
            <p className="mt-3 font-sans text-base font-semibold text-forest">Your cart is empty</p>
            <p className="mt-1 text-sm text-muted-foreground">Browse our collection and add your favorites.</p>
            <Link href="/shop" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-forest px-5 py-2 text-sm font-semibold text-white hover:bg-forest-light">
              Shop Products <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            {/* items */}
            <div className="divide-y divide-border rounded-2xl border border-border bg-white">
              {items.map((it) => (
                <div key={it.id} className="flex gap-3 p-4 sm:gap-4 sm:p-5">
                  <Link href={`/product/${it.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-blush-tile sm:h-24 sm:w-24">
                    {it.imageUrl && <img src={it.imageUrl} alt={it.name} className="h-full w-full object-cover" />}
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/product/${it.slug}`} className="text-sm font-semibold text-forest hover:text-forest-light">{it.name}</Link>
                      <button
                        onClick={() => onRemove(it.id, it.name)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove ${it.name}`}
                        disabled={busyId === it.id}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">${(it.priceCents / 100).toFixed(2)} each</p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="inline-flex items-center rounded-full border border-border">
                        <button onClick={() => onQty(it.id, Math.max(1, it.quantity - 1))} className="inline-flex h-9 w-9 items-center justify-center rounded-l-full text-forest hover:bg-forest/5 disabled:opacity-40" disabled={busyId === it.id || it.quantity <= 1} aria-label="Decrease quantity">
                          <Minus size={14} />
                        </button>
                        <span className="w-9 text-center text-sm font-semibold text-forest">{busyId === it.id ? "…" : it.quantity}</span>
                        <button onClick={() => onQty(it.id, Math.min(it.stock || 99, it.quantity + 1))} className="inline-flex h-9 w-9 items-center justify-center rounded-r-full text-forest hover:bg-forest/5 disabled:opacity-40" disabled={busyId === it.id || it.quantity >= (it.stock || 99)} aria-label="Increase quantity">
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="font-serif text-base font-bold text-forest">${(it.lineCents / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* summary */}
            <aside className="h-fit rounded-2xl border border-border bg-white p-5 sm:p-6 lg:sticky lg:top-24">
              <h2 className="font-sans text-lg font-bold text-forest">Order Summary</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Items ({cart.itemCount})</dt><dd className="text-forest">${(cart.subtotalCents / 100).toFixed(2)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd className="text-muted-foreground">Calculated at checkout</dd></div>
                <div className="flex justify-between border-t border-border pt-3"><dt className="font-semibold text-forest">Subtotal</dt><dd className="font-serif text-xl font-bold text-forest">${(cart.subtotalCents / 100).toFixed(2)}</dd></div>
              </dl>
              <Link
                href="/checkout"
                className={cn("mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-forest-light", loading && "opacity-60")}
              >
                Proceed to Checkout <ArrowRight size={16} />
              </Link>
              <Link href="/shop" className="mt-3 block text-center text-xs font-medium text-forest hover:text-forest-light">Continue shopping</Link>
            </aside>
          </div>
        )}
      </div>
    </StorefrontShell>
  );
}
