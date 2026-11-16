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
  serverCartCount: number; // synced from the server cart API (shared across components)
  serverWishCount: number; // synced from the server wishlist API (authed users)
  addToCart: (item: Omit<CartItem, "qty">) => void;
  removeFromCart: (id: string) => void;
  cartCount: () => number;
  setServerCartCount: (n: number) => void;
  setServerWishCount: (n: number) => void;
  toggleWishlist: (id: string) => void;
  isWished: (id: string) => boolean;
};

/**
 * Client UI store. The cart + wishlist are server-backed (Phase 2);
 * `serverCartCount` / `serverWishCount` are synced from the server APIs so the
 * header badge updates across components when any component mutates the cart.
 */
export const useShop = create<ShopStore>((set, get) => ({
  cart: [],
  wishlist: [],
  serverCartCount: 0,
  serverWishCount: 0,
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
  setServerCartCount: (n) => set({ serverCartCount: n }),
  setServerWishCount: (n) => set({ serverWishCount: n }),
  toggleWishlist: (id) =>
    set((s) => ({
      wishlist: s.wishlist.includes(id)
        ? s.wishlist.filter((w) => w !== id)
        : [...s.wishlist, id],
    })),
  isWished: (id) => get().wishlist.includes(id),
}));
