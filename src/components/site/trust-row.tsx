import { Sparkles, Truck, RefreshCcw, Headset } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "Curated Catalog",
    sub: "72 products to explore",
  },
  {
    icon: Truck,
    title: "Fast & Secure Shipping",
    sub: "Delivered in 2–4 days",
  },
  {
    icon: RefreshCcw,
    title: "Easy Returns Within 30 Days",
    sub: "Hassle-free policy",
  },
  {
    icon: Headset,
    title: "Customer Care",
    sub: "Here to help, 7 days",
  },
];

export function TrustRow() {
  return (
    <section className="bg-cream py-6 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-white/70 p-4 sm:gap-4 sm:p-5 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="flex items-center gap-3 rounded-xl px-2 py-1.5">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-forest/20 bg-blush/10 text-forest">
                <f.icon size={20} />
              </span>
              <div className="leading-tight">
                <p className="text-[13px] font-semibold text-forest">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
