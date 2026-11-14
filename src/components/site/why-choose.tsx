import { Leaf, Stethoscope, Recycle, Users } from "lucide-react";
import { SectionLabel } from "./ui-bits";

const reasons = [
  {
    icon: Leaf,
    title: "Clean Ingredients",
    sub: "Safe for your skin",
  },
  {
    icon: Stethoscope,
    title: "Dermatologist Tested",
    sub: "Gentle & effective",
  },
  {
    icon: Recycle,
    title: "Sustainable Beauty",
    sub: "Better for the planet",
  },
  {
    icon: Users,
    title: "Beauty for All",
    sub: "All skin types & tones",
  },
];

export function WhyChooseAngels() {
  return (
    <section className="bg-cream py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-0 overflow-hidden rounded-2xl bg-forest lg:grid-cols-[1.4fr_1fr]">
          <div className="p-7 sm:p-10 lg:p-12">
            <SectionLabel tone="white">Why Angels Beauty</SectionLabel>
            <h2 className="mt-3 font-serif text-2xl font-bold text-white sm:text-3xl">
              Why Choose Angels Beauty?
            </h2>
            <p className="mt-2 text-sm text-cream/70">
              Premium products. Real results. Always.
            </p>

            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {reasons.map((r) => (
                <div
                  key={r.title}
                  className="flex items-start gap-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10"
                >
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-forest">
                    <r.icon size={20} />
                  </span>
                  <div className="leading-tight">
                    <p className="text-sm font-semibold text-white">{r.title}</p>
                    <p className="text-xs text-cream/70">{r.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[240px] overflow-hidden">
            <img
              src="/images/banner-whychoose.png"
              alt="Angels Beauty serum and cream jar on a stone surface with flowers"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
