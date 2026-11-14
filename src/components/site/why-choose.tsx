import { Sparkles, ShieldCheck, Truck, Users } from "lucide-react";
import { SectionLabel } from "./ui-bits";

const reasons = [
  {
    icon: Sparkles,
    title: "Curated Selection",
    sub: "Thoughtfully chosen essentials",
  },
  {
    icon: ShieldCheck,
    title: "Secure Checkout",
    sub: "Protected payments",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    sub: "Ships in 2–4 days",
  },
  {
    icon: Users,
    title: "Beauty for All",
    sub: "For every routine",
  },
];

export function WhyChooseAngels() {
  return (
    <section className="bg-cream py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-0 overflow-hidden rounded-2xl bg-forest lg:grid-cols-[1.4fr_1fr]">
          <div className="p-7 sm:p-10 lg:p-12">
            <SectionLabel tone="white">Why Angels Beauty</SectionLabel>
            <h2 className="mt-3 font-sans text-2xl font-bold text-white sm:text-3xl">
              Why Choose Angels Beauty?
            </h2>
            <p className="mt-2 text-sm text-cream/80">
              A beauty shopping experience made for you.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-4 sm:gap-6">
              {reasons.map((r) => (
                <div key={r.title} className="flex flex-col items-center text-center">
                  <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white text-forest shadow-sm sm:h-20 sm:w-20">
                    <r.icon size={26} />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-white">{r.title}</p>
                  <p className="mt-0.5 text-xs text-cream/80">{r.sub}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[240px] overflow-hidden">
            <img
              src="/images/banner-whychoose.png"
              alt="Angels Beauty serum and cream jar on a stone surface with flowers"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
