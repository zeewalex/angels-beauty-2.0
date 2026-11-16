import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ArrowRight, Mail } from "lucide-react";
import { StorefrontShell } from "@/components/site/storefront-shell";
import { db } from "@/lib/db";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = await db.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order) notFound();

  return (
    <StorefrontShell>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-2xl border border-border bg-white p-6 text-center sm:p-10">
          <CheckCircle2 size={48} className="mx-auto text-forest-light" />
          <h1 className="mt-4 font-serif text-3xl font-bold text-forest">Order Received</h1>
          <p className="mt-2 text-sm text-muted-foreground">Thank you! Your order has been placed.</p>

          <div className="mt-6 rounded-xl bg-cream p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Order number</p>
            <p className="mt-1 font-serif text-xl font-bold text-forest">{order.orderNumber}</p>
          </div>

          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Status</dt><dd className="font-medium text-forest capitalize">{order.status.toLowerCase()} · payment pending</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Email</dt><dd className="text-forest">{order.email}</dd></div>
            <div className="flex justify-between border-t border-border pt-2"><dt className="font-semibold text-forest">Total</dt><dd className="font-serif text-lg font-bold text-forest">${(order.totalCents / 100).toFixed(2)}</dd></div>
          </dl>

          <ul className="mt-6 space-y-2 text-left">
            {order.items.map((it) => (
              <li key={it.id} className="flex items-center justify-between text-sm">
                <span className="text-forest">{it.name} × {it.quantity}</span>
                <span className="text-muted-foreground">${(it.lineCents / 100).toFixed(2)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Mail size={13} /> A confirmation will be emailed when payment processing is live (Phase 3).
          </div>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/shop" className="inline-flex items-center gap-1.5 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white hover:bg-forest-light">
              Continue Shopping <ArrowRight size={15} />
            </Link>
            <Link href="/account/orders" className="text-sm font-medium text-forest hover:text-forest-light">View my orders</Link>
          </div>
        </div>
      </div>
    </StorefrontShell>
  );
}
