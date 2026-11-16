"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, ShoppingBag } from "lucide-react";
import { StorefrontShell } from "@/components/site/storefront-shell";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/lib/cart-client";
import { addressSchema } from "@/lib/schemas";
import { toast } from "sonner";

type Form = {
  email: string;
  shipping: { firstName: string; lastName: string; line1: string; line2: string; city: string; state: string; postalCode: string; country: string; phone: string };
  billingSameAsShipping: boolean;
  billing: { firstName: string; lastName: string; line1: string; line2: string; city: string; state: string; postalCode: string; country: string; phone: string };
  customerNote: string;
  couponCode: string;
};

const emptyAddr = { firstName: "", lastName: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "", phone: "" };

export default function CheckoutPage() {
  const router = useRouter();
  const { cart } = useCart();
  const [form, setForm] = useState<Form>({
    email: "", shipping: { ...emptyAddr }, billingSameAsShipping: true, billing: { ...emptyAddr }, customerNote: "", couponCode: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cart.items.length === 0) {
      // allow render of empty state; don't hard-redirect
    }
  }, [cart]);

  const subtotal = cart.subtotalCents / 100;
  const shipping = cart.items.length === 0 ? 0 : subtotal >= 50 ? 0 : 5.99;
  const total = subtotal + shipping;

  function setShip(k: keyof typeof form.shipping, v: string) {
    setForm({ ...form, shipping: { ...form.shipping, [k]: v } });
  }
  function setBill(k: keyof typeof form.billing, v: string) {
    setForm({ ...form, billing: { ...form.billing, [k]: v } });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    // validate
    const shipParse = addressSchema.safeParse(form.shipping);
    const billParse = form.billingSameAsShipping ? true : addressSchema.safeParse(form.billing);
    const emailOk = /\S+@\S+\.\S+/.test(form.email);
    const newErrors: Record<string, string> = {};
    if (!emailOk) newErrors["email"] = "Enter a valid email";
    if (!shipParse.success) for (const i of shipParse.error.issues) newErrors[`shipping.${i.path.join(".")}`] = i.message;
    if (billParse !== true && !billParse.success) for (const i of billParse.error.issues) newErrors[`billing.${i.path.join(".")}`] = i.message;
    if (Object.keys(newErrors).length) { setErrors(newErrors); toast.error("Please correct the highlighted fields."); return; }

    setLoading(true);
    const payload = { ...form, billing: form.billingSameAsShipping ? undefined : form.billing, couponCode: form.couponCode || undefined };
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      toast.error(data?.error?.message || "Checkout failed.");
      if (data?.error?.fields) setErrors(data.error.fields);
      return;
    }
    router.push(`/checkout/confirmation/${data.orderNumber}`);
  }

  if (cart.items.length === 0) {
    return (
      <StorefrontShell>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <ShoppingBag size={32} className="mx-auto text-muted-foreground" />
          <h1 className="mt-3 font-serif text-2xl font-bold text-forest">Your cart is empty</h1>
          <p className="mt-2 text-sm text-muted-foreground">Add some products before checking out.</p>
          <Link href="/shop" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-forest px-5 py-2 text-sm font-semibold text-white hover:bg-forest-light">
            Shop Products <ArrowRight size={15} />
          </Link>
        </div>
      </StorefrontShell>
    );
  }

  return (
    <StorefrontShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Cart", href: "/cart" }, { label: "Checkout" }]} />
        <h1 className="mt-4 font-sans text-3xl font-bold text-forest sm:text-4xl">Checkout</h1>

        <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* left: forms */}
          <div className="space-y-6">
            {/* contact */}
            <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
              <h2 className="font-sans text-lg font-bold text-forest">Contact</h2>
              <div className="mt-3">
                <Label htmlFor="email">Email (for order confirmation)</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" placeholder="you@example.com" />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>
            </section>

            {/* shipping */}
            <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
              <h2 className="font-sans text-lg font-bold text-forest">Shipping Address</h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div><Label>First name</Label><Input value={form.shipping.firstName} onChange={(e) => setShip("firstName", e.target.value)} className="mt-1" />{errors["shipping.firstName"] && <p className="mt-1 text-xs text-red-600">{errors["shipping.firstName"]}</p>}</div>
                <div><Label>Last name</Label><Input value={form.shipping.lastName} onChange={(e) => setShip("lastName", e.target.value)} className="mt-1" />{errors["shipping.lastName"] && <p className="mt-1 text-xs text-red-600">{errors["shipping.lastName"]}</p>}</div>
                <div className="col-span-2"><Label>Street address</Label><Input value={form.shipping.line1} onChange={(e) => setShip("line1", e.target.value)} className="mt-1" />{errors["shipping.line1"] && <p className="mt-1 text-xs text-red-600">{errors["shipping.line1"]}</p>}</div>
                <div className="col-span-2"><Label>Apt / Suite (optional)</Label><Input value={form.shipping.line2} onChange={(e) => setShip("line2", e.target.value)} className="mt-1" /></div>
                <div><Label>City</Label><Input value={form.shipping.city} onChange={(e) => setShip("city", e.target.value)} className="mt-1" />{errors["shipping.city"] && <p className="mt-1 text-xs text-red-600">{errors["shipping.city"]}</p>}</div>
                <div><Label>State / Region</Label><Input value={form.shipping.state} onChange={(e) => setShip("state", e.target.value)} className="mt-1" />{errors["shipping.state"] && <p className="mt-1 text-xs text-red-600">{errors["shipping.state"]}</p>}</div>
                <div><Label>Postal code</Label><Input value={form.shipping.postalCode} onChange={(e) => setShip("postalCode", e.target.value)} className="mt-1" />{errors["shipping.postalCode"] && <p className="mt-1 text-xs text-red-600">{errors["shipping.postalCode"]}</p>}</div>
                <div><Label>Country</Label><Input value={form.shipping.country} onChange={(e) => setShip("country", e.target.value)} className="mt-1" />{errors["shipping.country"] && <p className="mt-1 text-xs text-red-600">{errors["shipping.country"]}</p>}</div>
              </div>
            </section>

            {/* billing */}
            <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
              <label className="flex items-center gap-2 text-sm font-medium text-forest">
                <input type="checkbox" checked={form.billingSameAsShipping} onChange={(e) => setForm({ ...form, billingSameAsShipping: e.target.checked })} className="h-4 w-4 accent-forest" />
                Billing address same as shipping
              </label>
              {!form.billingSameAsShipping && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div><Label>First name</Label><Input value={form.billing.firstName} onChange={(e) => setBill("firstName", e.target.value)} className="mt-1" />{errors["billing.firstName"] && <p className="mt-1 text-xs text-red-600">{errors["billing.firstName"]}</p>}</div>
                  <div><Label>Last name</Label><Input value={form.billing.lastName} onChange={(e) => setBill("lastName", e.target.value)} className="mt-1" />{errors["billing.lastName"] && <p className="mt-1 text-xs text-red-600">{errors["billing.lastName"]}</p>}</div>
                  <div className="col-span-2"><Label>Street address</Label><Input value={form.billing.line1} onChange={(e) => setBill("line1", e.target.value)} className="mt-1" />{errors["billing.line1"] && <p className="mt-1 text-xs text-red-600">{errors["billing.line1"]}</p>}</div>
                  <div><Label>City</Label><Input value={form.billing.city} onChange={(e) => setBill("city", e.target.value)} className="mt-1" /></div>
                  <div><Label>State</Label><Input value={form.billing.state} onChange={(e) => setBill("state", e.target.value)} className="mt-1" /></div>
                  <div><Label>Postal code</Label><Input value={form.billing.postalCode} onChange={(e) => setBill("postalCode", e.target.value)} className="mt-1" /></div>
                  <div><Label>Country</Label><Input value={form.billing.country} onChange={(e) => setBill("country", e.target.value)} className="mt-1" /></div>
                </div>
              )}
            </section>

            {/* note */}
            <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
              <Label htmlFor="note">Order note (optional)</Label>
              <textarea id="note" value={form.customerNote} onChange={(e) => setForm({ ...form, customerNote: e.target.value })} maxLength={500} className="mt-1 min-h-[70px] w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-forest focus:outline-none" placeholder="Delivery instructions, etc." />
            </section>
          </div>

          {/* right: summary */}
          <aside className="h-fit rounded-2xl border border-border bg-white p-5 sm:p-6 lg:sticky lg:top-24">
            <h2 className="font-sans text-lg font-bold text-forest">Order Summary</h2>
            <ul className="mt-4 space-y-3">
              {cart.items.map((it) => (
                <li key={it.id} className="flex gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-blush-tile">
                    {it.imageUrl && <img src={it.imageUrl} alt={it.name} className="h-full w-full object-cover" />}
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-forest px-1 text-[10px] font-bold text-white">{it.quantity}</span>
                  </div>
                  <div className="flex flex-1 items-center justify-between gap-2">
                    <span className="text-xs font-medium text-forest line-clamp-2">{it.name}</span>
                    <span className="text-xs font-semibold text-forest">${(it.lineCents / 100).toFixed(2)}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <Label htmlFor="couponCode">Coupon code (optional)</Label>
              <Input id="couponCode" value={form.couponCode} onChange={(e) => setForm({ ...form, couponCode: e.target.value })} className="mt-1" placeholder="e.g. SAVE10" />
              {errors.couponCode && <p className="mt-1 text-xs text-red-600">{errors.couponCode}</p>}
            </div>
            <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="text-forest">${subtotal.toFixed(2)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd className="text-forest">{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</dd></div>
              <div className="flex justify-between border-t border-border pt-2"><dt className="font-semibold text-forest">Total</dt><dd className="font-serif text-xl font-bold text-forest">${total.toFixed(2)}</dd></div>
            </dl>
            <Button type="submit" disabled={loading} className="mt-5 w-full gap-2 bg-forest hover:bg-forest-light">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Placing order…</> : <>Place Order <ArrowRight size={16} /></>}
            </Button>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              No payment is processed yet (Phase 3). Your order is created as pending.
            </p>
          </aside>
        </form>
      </div>
    </StorefrontShell>
  );
}
