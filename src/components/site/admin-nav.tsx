"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Package, FolderTree, ShoppingCart, Users, Tag, ScrollText, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/promotions", label: "Promotions", icon: Tag },
  { href: "/admin/hero-slides", label: "Hero Slides", icon: Tag },
  { href: "/admin/pages", label: "Pages & Policies", icon: ScrollText },
  { href: "/admin/blog", label: "Blog", icon: ScrollText },
  { href: "/admin/faqs", label: "FAQs", icon: ScrollText },
  { href: "/admin/contact-info", label: "Contact Info", icon: Users },
  { href: "/admin/support", label: "Support", icon: Users },
  { href: "/admin/audit", label: "Audit Log", icon: ScrollText },
];

export function AdminNav({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-border bg-white sm:w-56 sm:border-b-0 sm:border-r sm:h-[calc(100vh-3.5rem)] sm:sticky sm:top-14">
      <div className="hidden px-4 py-3 sm:block">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Admin</p>
        <p className="truncate text-sm font-semibold text-forest">{adminName}</p>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-2 py-2 sm:flex-col sm:overflow-visible">
        {items.map((it) => {
          const active = pathname === it.href || (it.href !== "/admin" && pathname.startsWith(it.href));
          return (
            <Link key={it.href} href={it.href}
              className={cn("flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-forest text-white" : "text-forest hover:bg-forest/5")}>
              <it.icon size={16} /> {it.label}
            </Link>
          );
        })}
      </nav>
      <button onClick={() => signOut({ callbackUrl: "/" })} className="mt-auto hidden items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-forest sm:flex">
        <LogOut size={15} /> Sign out
      </button>
    </aside>
  );
}
