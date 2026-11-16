import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { FulfillmentEditor } from "@/components/site/fulfillment-editor";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: { items: true, payments: true, shipments: true, shippingAddress: true },
  });
  if (!order) notFound();

  return (
    <div>
      <a href="/admin/orders" className="text-xs font-medium text-muted-foreground hover:text-forest">← Orders</a>
      <h1 className="mt-1 font-sans text-2xl font-bold text-forest">{order.orderNumber}</h1>
      <p className="text-sm text-muted-foreground">{order.email} · {new Date(order.createdAt).toLocaleString()}</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</p>
          <p className="mt-1 text-sm font-semibold text-forest">{order.status} · {order.paymentStatus}</p>
          <div className="mt-3"><FulfillmentEditor orderId={order.id} current={order.fulfillmentStatus} /></div>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total</p>
          <p className="mt-1 font-serif text-2xl font-bold text-forest">${(order.totalCents / 100).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Subtotal ${(order.subtotalCents / 100).toFixed(2)} · Shipping ${(order.shippingCents / 100).toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-border bg-white p-4">
        <h2 className="font-sans text-base font-bold text-forest">Items</h2>
        <ul className="mt-3 divide-y divide-border">
          {order.items.map((it) => (
            <li key={it.id} className="flex items-center justify-between py-2 text-sm">
              <div className="flex items-center gap-3">
                {it.imageUrl && <img src={it.imageUrl} alt="" className="h-10 w-10 rounded object-cover" />}
                <span className="text-forest">{it.name} × {it.quantity}</span>
              </div>
              <span className="text-muted-foreground">${(it.lineCents / 100).toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </div>

      {order.shippingAddress && (
        <div className="mt-5 rounded-xl border border-border bg-white p-4">
          <h2 className="font-sans text-base font-bold text-forest">Shipping Address</h2>
          <p className="mt-2 text-sm text-muted-foreground">{order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}<br />{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />{order.shippingAddress.country}</p>
        </div>
      )}

      <div className="mt-5 rounded-xl border border-border bg-white p-4">
        <h2 className="font-sans text-base font-bold text-forest">Payments</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {order.payments.map((p) => (
            <li key={p.id} className="flex justify-between text-muted-foreground">
              <span>{p.provider} · {p.idempotencyKey.slice(0, 16)}…</span>
              <span className={p.status === "PAID" ? "font-semibold text-forest" : ""}>{p.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
