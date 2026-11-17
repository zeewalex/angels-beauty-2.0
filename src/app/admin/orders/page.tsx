import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";

export default async function AdminOrdersPage() {
  await requireRole("ADMIN");
  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { items: { select: { name: true, quantity: true } } },
    select: { id: true, orderNumber: true, email: true, status: true, paymentStatus: true, fulfillmentStatus: true, totalCents: true, createdAt: true, items: true },
  });

  return (
    <div>
      <h1 className="font-sans text-2xl font-bold text-forest sm:text-3xl">Orders</h1>
      <p className="mt-1 text-sm text-muted-foreground">{orders.length} orders.</p>
      <div className="mt-5 overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-cream-dark/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="px-4 py-3">Order</th><th className="hidden px-4 py-3 sm:table-cell">Email</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3">Fulfillment</th><th className="hidden px-4 py-3 sm:table-cell">Date</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-cream/40">
                <td className="px-4 py-3"><Link href={`/admin/orders/${o.id}`} className="font-medium text-forest hover:text-forest-light">{o.orderNumber}</Link></td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{o.email}</td>
                <td className="px-4 py-3 font-medium text-forest">${(o.totalCents / 100).toFixed(2)}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${o.paymentStatus === "PAID" ? "bg-forest/10 text-forest" : o.paymentStatus === "FAILED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{o.paymentStatus}</span></td>
                <td className="px-4 py-3 text-muted-foreground">{o.fulfillmentStatus}</td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{new Date(o.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
