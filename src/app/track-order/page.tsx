"use client";

import { useState } from "react";
import { Search, Package, Clock, CheckCircle2, XCircle } from "lucide-react";
import { StorefrontShell } from "@/components/site/storefront-shell";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type OrderInfo = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  totalCents: number;
  createdAt: string;
  email: string;
  items: { name: string; quantity: number; lineCents: number }[];
};

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOrder(null);
    if (!orderNumber || !email) { setError("Please enter your order number and email."); return; }
    setLoading(true);
    const res = await fetch(`/api/track-order?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}`);
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setOrder(data.order);
    } else {
      setError("No order found matching that number and email. Please check your details.");
    }
  }

  return (
    <StorefrontShell>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Track Order" }]} />
        <h1 className="mt-4 font-serif text-3xl font-bold text-forest sm:text-4xl">Track Your Order</h1>
        <p className="mt-2 text-sm text-muted-foreground">Enter your order number and the email used at checkout.</p>

        <form onSubmit={lookup} className="mt-6 space-y-4 rounded-xl border border-border bg-white p-6">
          <div>
            <Label htmlFor="orderNumber">Order Number</Label>
            <Input id="orderNumber" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} className="mt-1" placeholder="e.g. AB-MWJRYT3S-54C067" />
          </div>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" placeholder="you@example.com" />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full gap-2 bg-forest hover:bg-forest-light">
            <Search size={16} /> {loading ? "Searching..." : "Track Order"}
          </Button>
        </form>

        {order && (
          <div className="mt-6 rounded-xl border border-border bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Order</p>
                <p className="font-serif text-lg font-bold text-forest">{order.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total</p>
                <p className="font-serif text-lg font-bold text-forest">${(order.totalCents / 100).toFixed(2)}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-cream p-3">
                <p className="text-xs text-muted-foreground">Payment</p>
                <p className="text-sm font-semibold capitalize text-forest">{order.paymentStatus.toLowerCase().replace("_", " ")}</p>
              </div>
              <div className="rounded-lg bg-cream p-3">
                <p className="text-xs text-muted-foreground">Fulfillment</p>
                <p className="text-sm font-semibold capitalize text-forest">{order.fulfillmentStatus.toLowerCase().replace("_", " ")}</p>
              </div>
              <div className="rounded-lg bg-cream p-3">
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="text-sm font-semibold text-forest">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Items</p>
              <ul className="space-y-1">
                {order.items.map((it, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span className="text-forest">{it.name} × {it.quantity}</span>
                    <span className="text-muted-foreground">${(it.lineCents / 100).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              <Clock size={12} className="inline" /> Order status reflects internal fulfillment. Carrier tracking will appear here when shipping integration is live.
            </p>
          </div>
        )}
      </div>
    </StorefrontShell>
  );
}
