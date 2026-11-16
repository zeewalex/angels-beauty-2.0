"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useShop } from "@/lib/shop-store";

type WishItem = { productId: string; name: string; slug: string; priceCents: number; imageUrl: string | null };

/**
 * Persistent wishlist for signed-in users (server DB via /api/wishlist).
 * Falls back to in-memory Zustand for guests (not persistent — prompts sign-in).
 */
export function useWishlist() {
  const { data: session, status } = useSession();
  const guestToggle = useShop((s) => s.toggleWishlist);
  const guestWishlist = useShop((s) => s.wishlist);
  const [items, setItems] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      const res = await fetch("/api/wishlist", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
        useShop.getState().setServerWishCount(data.items?.length ?? 0);
      }
    } catch { /* ignore */ }
  }, [status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const isWished = useCallback(
    (productId: string) => {
      if (status === "authenticated") return items.some((i) => i.productId === productId);
      return guestWishlist.includes(productId);
    },
    [status, items, guestWishlist],
  );

  const toggle = useCallback(
    async (productId: string, name?: string) => {
      if (status !== "authenticated") {
        guestToggle(productId);
        return { ok: true, guest: true, message: "Sign in to save your wishlist across devices." };
      }
      setLoading(true);
      const wasWished = items.some((i) => i.productId === productId);
      const res = await fetch("/api/wishlist", {
        method: wasWished ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      setLoading(false);
      if (res.ok) { await refresh(); return { ok: true, guest: false }; }
      return { ok: false, guest: false, message: "Could not update wishlist." };
    },
    [status, items, guestToggle, refresh],
  );

  const count = status === "authenticated" ? items.length : guestWishlist.length;
  return { isWished, toggle, count, items, loading, authed: status === "authenticated" };
}
