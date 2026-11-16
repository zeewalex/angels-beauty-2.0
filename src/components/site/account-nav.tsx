"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, MapPin, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/account", label: "Profile", icon: User },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/orders", label: "Orders", icon: Package },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-2 overflow-x-auto rounded-xl border border-border bg-white p-1.5 sm:flex-col sm:gap-1">
      {items.map((it) => {
        const active = pathname === it.href || (it.href !== "/account" && pathname.startsWith(it.href));
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-forest text-white" : "text-forest hover:bg-forest/5",
            )}
          >
            <it.icon size={16} />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
