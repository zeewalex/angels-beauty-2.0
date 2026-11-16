import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, XCircle, ArrowRight, Mail, Package } from "lucide-react";
import { StorefrontShell } from "@/components/site/storefront-shell";
import { OrderPaymentActions } from "@/components/site/order-payment-actions";
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

  const isDev = process.env.NODE_ENV !== "production";
  const paid = order.paymentStatus === "PAID" && order.status === "CONFIRMED";
  const failed = order.paymentStatus === "FAILED" || order.status === "CANCELLED";
  const pending = !paid && !failed;

  const banner = paid
    ? { icon: CheckCircle2, color: "text-forest-light", title: "Payment Successful", sub: "Your order is confirmed and will be processed." }
    : failed
    ? { icon: XCircle, color: "text-red-600", title: "Payment Failed", sub: "Your reservation was released. You can place a new order from your cart." }
    : { icon: Clock, color: "text-amber-600", title: "Payment Pending", sub: "Your items are reserved. Complete payment to confirm your order." };

  const BannerIcon = banner.icon;

  return (
    <StorefrontShell>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-2xl border border-border bg-white p-6 text-center sm:p-10">
          <BannerIcon size={48} className={`mx-auto ${banner.color}`} />
          <h1 className="mt-4 font-serif text-3xl font-bold text-forest">{banner.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{banner.sub}</p>

          <div className="mt-6 rounded-xl bg-cream p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Order number</p>
            <p className="mt-1 font-serif text-xl font-bold text-forest">{order.orderNumber}</p>
          </div>

          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Order status</dt><dd className="font-medium text-forest capitalize">{order.status.toLowerCase()}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Payment</dt>
              <dd className={`font-medium capitalize ${paid ? "text-forest-light" : failed ? "text-red-600" : "text-amber-600"}`}>
                {order.paymentStatus.toLowerCase().replace("_", " ")}
              </dd>
            </div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Email</dt><dd className="text-forest">{order.email}</dd></div>
            <div className="flex justify-between border-t border-border pt-2"><dt className="font-semibold text-forest">Total</dt><dd className="font-serif text-lg font-bold text-forest">${(order.totalCents / 100).toFixed(2)}</dd></div>
          </dl>

          {pending && (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <Clock size={12} className="mr-1 inline" />
              Reservation holds your items for 30 minutes. If payment isn&apos;t completed, the order is cancelled and stock is released.
            </p>
          )}

          <ul className="mt-6 space-y-2 text-left">
            {order.items.map((it) => (
              <li key={it.id} className="flex items-center justify-between text-sm">
                <span className="text-forest">{it.name} × {it.quantity}</span>
                <span className="text-muted-foreground">${(it.lineCents / 100).toFixed(2)}</span>
              </li>
            ))}
          </ul>

          {pending && isDev && <OrderPaymentActions orderNumber={order.orderNumber} />}

          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Mail size={13} /> A confirmation will be emailed when payment processing is live (Phase 3).
          </div>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/shop" className="inline-flex items-center gap-1.5 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white hover:bg-forest-light">
              Continue Shopping <ArrowRight size={15} />
            </Link>
            <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:text-forest-light">
              <Package size={14} /> View my orders
            </Link>
          </div>
        </div>
      </div>
    </StorefrontShell>
  );
}
