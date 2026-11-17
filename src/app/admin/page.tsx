import Link from "next/link";
import { Package, AlertTriangle, Users, ShoppingCart, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";

export default async function AdminDashboard() {
  const [productCount, lowStock, customerCount, orderStats, recentOrders, pendingOrders] = await Promise.all([
    db.product.count({ where: { status: { in: ["ACTIVE", "ARCHIVED"] } } }),
    db.inventory.findMany({ where: { quantity: { lte: 10 }, trackInventory: true }, include: { variant: { include: { product: { select: { name: true, slug: true } } } } }, take: 6 }),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.order.groupBy({ by: ["paymentStatus"], _count: true, _sum: { totalCents: true } }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { orderNumber: true, status: true, paymentStatus: true, totalCents: true, createdAt: true, email: true } }),
    db.order.count({ where: { status: "PENDING", paymentStatus: "PENDING" } }),
  ]);

  const totalRevenue = orderStats.filter((o) => o.paymentStatus === "PAID").reduce((n, o) => n + (o._sum.totalCents ?? 0), 0);
  const paidOrders = orderStats.find((o) => o.paymentStatus === "PAID")?._count ?? 0;

  const stat = (label: string, value: string, icon: typeof Package, hint?: string) => (
    <div className="rounded-xl border border-border bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <icon size={18} className="text-forest-light" />
      </div>
      <p className="mt-2 font-serif text-3xl font-bold text-forest">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );

  return (
    <div>
      <h1 className="font-sans text-2xl font-bold text-forest sm:text-3xl">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Store overview at a glance.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stat("Products", String(productCount), Package, "active + archived")}
        {stat("Customers", String(customerCount), Users)}
        {stat("Orders (paid)", String(paidOrders), ShoppingCart, `${pendingOrders} pending payment`)}
        {stat("Revenue (paid)", `$${(totalRevenue / 100).toFixed(2)}`, ShoppingCart)}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Low stock alerts */}
        <section className="rounded-xl border border-border bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-sans text-base font-bold text-forest">Inventory Alerts</h2>
            <AlertTriangle size={18} className="text-amber-600" />
          </div>
          {lowStock.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No low-stock items.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {lowStock.map((i) => (
                <li key={i.id} className="flex items-center justify-between text-sm">
                  <Link href={`/admin/products/${i.variant.productId}`} className="text-forest hover:text-forest-light">{i.variant.product.name}</Link>
                  <span className={i.quantity <= 0 ? "font-semibold text-red-600" : "font-semibold text-amber-600"}>{i.quantity} left</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent orders */}
        <section className="rounded-xl border border-border bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-sans text-base font-bold text-forest">Recent Orders</h2>
            <Link href="/admin/orders" className="inline-flex items-center gap-1 text-xs font-semibold text-forest hover:text-forest-light">All <ArrowRight size={12} /></Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {recentOrders.map((o) => (
                <li key={o.orderNumber} className="flex items-center justify-between text-sm">
                  <div>
                    <Link href={`/admin/orders/${o.id}`} className="font-medium text-forest hover:text-forest-light">{o.orderNumber}</Link>
                    <p className="text-xs text-muted-foreground">{o.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-forest">${(o.totalCents / 100).toFixed(2)}</p>
                    <p className="text-xs capitalize text-muted-foreground">{o.paymentStatus.toLowerCase().replace("_", " ")}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
