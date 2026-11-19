"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Heart, ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { Logo } from "./logo";
import { navLinks } from "@/lib/demo-data";
import { catalogCategories } from "@/lib/catalog";
import { useShop } from "@/lib/shop-store";
import { useCart } from "@/lib/cart-client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  if (href === "/shop")
    return pathname === "/shop" || pathname.startsWith("/category") || pathname.startsWith("/product");
  return pathname === href;
}

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useCart(); // trigger server cart fetch + sync count to the shared store
  const cartCount = useShop((s) => s.serverCartCount);
  const wishlistCount = useShop((s) =>
    s.serverWishCount > 0 ? s.serverWishCount : s.wishlist.length,
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-cream/95 backdrop-blur transition-shadow",
        scrolled ? "shadow-[0_4px_20px_-12px_rgba(27,67,50,0.25)]" : "",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Left: logo (mobile menu button on small screens) */}
        <div className="flex items-center gap-2">
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-forest hover:bg-forest/5 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <Logo enableTapShortcut />
        </div>

        {/* Center: nav */}
        <nav className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => {
            const active = isActive(link.href, pathname);
            return (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "relative text-[13px] font-medium text-forest transition-colors hover:text-forest-light",
                  active && "font-semibold",
                )}
              >
                <span className="flex items-center gap-1">
                  {link.label}
                  {link.hasDropdown && <ChevronDown size={13} className="opacity-60" />}
                </span>
                {active && (
                  <span className="absolute -bottom-1.5 left-0 h-0.5 w-full rounded-full bg-forest" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/shop"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-forest hover:bg-forest/5"
            aria-label="Search products"
          >
            <Search size={20} />
          </Link>
          <Link
            href="/wishlist"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-forest hover:bg-forest/5"
            aria-label="Wishlist"
          >
            <Heart size={20} />
            {wishlistCount > 0 && (
              <span
                key={wishlistCount}
                className="animate-pop absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blush-dark text-[9px] font-bold text-white"
              >
                {wishlistCount}
              </span>
            )}
          </Link>
          <Link
            href="/cart"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-forest transition-colors hover:bg-forest/5"
            aria-label="Cart"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span
                key={cartCount}
                className="animate-pop absolute right-1 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-forest px-1 text-[9px] font-bold text-white"
              >
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile menu */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[300px] bg-cream p-0">
          <SheetHeader className="flex flex-row items-center justify-between border-b border-border px-5 py-4">
            <SheetTitle asChild>
              <div>
                <Logo enableTapShortcut />
              </div>
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setMobileOpen(false)}
            >
              <X size={20} />
            </Button>
          </SheetHeader>
          <nav className="flex flex-col px-3 py-4">
            {navLinks.map((link) => {
              const active = isActive(link.href, pathname);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-forest hover:bg-forest/5",
                    active && "bg-forest/5 font-semibold",
                  )}
                >
                  {link.label}
                  {link.hasDropdown && <ChevronDown size={15} />}
                </Link>
              );
            })}
            <div className="mt-3 border-t border-border pt-3">
              <p className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Categories
              </p>
              <div className="max-h-72 overflow-y-auto scrollbar-blush pr-1">
                {catalogCategories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/category/${c.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm text-forest hover:bg-forest/5"
                  >
                    {c.name}
                    <span className="text-[11px] text-muted-foreground">{c.count}</span>
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
