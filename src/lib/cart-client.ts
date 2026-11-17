"use client";

import { useCallback, useEffect, useState } from "react";
import { useShop } from "@/lib/shop-store";
import type { SerializedCart } from "@/lib/cart-server";

const EMPTY: SerializedCart = { id: "", items: [], subtotalCents: 0, itemCount: 0 };

/**
 * Client hook over the server-side cart API.
 * The server is the source of truth for prices, stock, and persistence.
 */
export function useCart() {
  const [cart, setCart] = useState<SerializedCart>(EMPTY);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (res.ok) {
        const data: SerializedCart = await res.json();
        setCart(data);
        useShop.getState().setServerCartCount(data.itemCount);
      }
    } catch {
      /* ignore — badge stays 0 */
    }
  }, []);

  useEffect(() => {
    // Sync client cart state with the server on mount (legitimate external-sync effect).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const addItem = useCallback(async (variantId: string, quantity = 1) => {
    setLoading(true);
    const res = await fetch("/api/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId, quantity }),
    });
    setLoading(false);
    if (res.ok) {
      const data: SerializedCart = await res.json();
      setCart(data);
      useShop.getState().setServerCartCount(data.itemCount);
      return { ok: true };
    }
    const data = await res.json().catch(() => ({}));
    return { ok: false, message: data?.error?.message || "Could not add to cart." };
  }, []);

  const updateItem = useCallback(async (id: string, quantity: number) => {
    const res = await fetch(`/api/cart/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    if (res.ok) { const data: SerializedCart = await res.json(); setCart(data); useShop.getState().setServerCartCount(data.itemCount); }
    else {
      const data = await res.json().catch(() => ({}));
      return data?.error?.message || "Could not update.";
    }
  }, []);

  const removeItem = useCallback(async (id: string) => {
    const res = await fetch(`/api/cart/items/${id}`, { method: "DELETE" });
    if (res.ok) { const data: SerializedCart = await res.json(); setCart(data); useShop.getState().setServerCartCount(data.itemCount); }
  }, []);

  return { cart, loading, itemCount: cart.itemCount, refresh, addItem, updateItem, removeItem };
}
