"use client";

import { create } from "zustand";

type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  qty: number;
};

type ShopStore = {
  cart: CartItem[];
  wishlist: string[];
  addToCart: (item: Omit<CartItem, "qty">) => void;
  removeFromCart: (id: string) => void;
  cartCount: () => number;
  toggleWishlist: (id: string) => void;
  isWished: (id: string) => boolean;
};

/**
 * In-memory demo shop store for the Phase 1 homepage build.
 *
 * NOTE: This is temporary demo state. It is intentionally NOT persisted so
 * that server and client first-render match (no hydration mismatch). Real
 * cart/account state will be backed by Supabase + server sessions in Phase 3.
 */
export const useShop = create<ShopStore>((set, get) => ({
  cart: [],
  wishlist: [],
  addToCart: (item) =>
    set((s) => {
      const existing = s.cart.find((c) => c.id === item.id);
      if (existing) {
        return {
          cart: s.cart.map((c) =>
            c.id === item.id ? { ...c, qty: c.qty + 1 } : c,
          ),
        };
      }
      return { cart: [...s.cart, { ...item, qty: 1 }] };
    }),
  removeFromCart: (id) =>
    set((s) => ({ cart: s.cart.filter((c) => c.id !== id) })),
  cartCount: () => get().cart.reduce((n, c) => n + c.qty, 0),
  toggleWishlist: (id) =>
    set((s) => ({
      wishlist: s.wishlist.includes(id)
        ? s.wishlist.filter((w) => w !== id)
        : [...s.wishlist, id],
    })),
  isWished: (id) => get().wishlist.includes(id),
}));
