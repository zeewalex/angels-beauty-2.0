import Link from "next/link";
import { Package, ArrowRight } from "lucide-react";
import { StorefrontShell } from "@/components/site/storefront-shell";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { AccountNav } from "@/components/site/account-nav";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";

export default async function OrdersPage() {
  const session = await requireSession();
  const orders = await db.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      orderNumber: true,
      status: true,
      paymentStatus: true,
      fulfillmentStatus: true,
      totalCents: true,
      createdAt: true,
      items: { select: { name: true, quantity: true, imageUrl: true } },
    },
  });

  return (
    <StorefrontShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "My Account", href: "/account" }, { label: "Orders" }]} />
        <div className="mt-4 grid gap-6 lg:grid-cols-[220px_1fr]">
          <AccountNav />
          <div className="rounded-2xl border border-border bg-white p-6 sm:p-8">
            <h1 className="font-serif text-2xl font-bold text-forest">Order History</h1>

            {orders.length === 0 ? (
              <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-12 text-center">
                <Package size={30} className="text-muted-foreground" />
                <p className="mt-3 text-sm font-semibold text-forest">No orders yet</p>
                <p className="mt-1 text-sm text-muted-foreground">When you place an order, it will appear here.</p>
                <Link href="/shop" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-forest px-5 py-2 text-sm font-semibold text-white hover:bg-forest-light">
                  Start Shopping <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <ul className="mt-6 space-y-3">
                {orders.map((o) => (
                  <li key={o.orderNumber} className="rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-forest">Order {o.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-serif text-lg font-bold text-forest">${(o.totalCents / 100).toFixed(2)}</p>
                        <p className="text-xs capitalize text-muted-foreground">{o.paymentStatus.toLowerCase()} · {o.fulfillmentStatus.toLowerCase()}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {o.items.slice(0, 5).map((it, i) => (
                        <span key={i} className="rounded-full bg-cream-dark px-2.5 py-0.5 text-[11px] text-forest">{it.name} × {it.quantity}</span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </StorefrontShell>
  );
}
