import { ArrowRight } from "lucide-react";
import { SectionLabel } from "./ui-bits";

export function SaleBanner() {
  return (
    <section className="bg-cream py-6 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center overflow-hidden rounded-2xl bg-blush lg:grid-cols-[1fr_1.3fr_1fr]">
          <div className="relative hidden h-full min-h-[260px] overflow-hidden lg:block">
            <img
              src="/images/banner-sale.png"
              alt="Woman applying face cream"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
          </div>

          {/* neutral campaign message (no discount) */}
          <div className="px-6 py-9 text-left sm:px-10 sm:py-12">
            <SectionLabel tone="green">Beauty Campaign</SectionLabel>
            <h2 className="mt-3 font-serif text-3xl font-bold text-forest sm:text-4xl">
              Glow Up This Season
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-forest/80">
              Discover this season&apos;s skincare and makeup essentials,
              thoughtfully chosen for your natural glow.
            </p>
            <div className="mt-5">
              <a
                href="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-forest-light"
              >
                Shop the Collection
                <ArrowRight size={15} />
              </a>
            </div>
          </div>

          {/* neutral "New Season" badge (no discount) */}
          <div className="relative flex min-h-[200px] items-center justify-center px-6 py-8 sm:min-h-[240px]">
            <div
              className="flex h-36 w-36 items-center justify-center rounded-full bg-forest text-center shadow-lg sm:h-44 sm:w-44"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 30% 30%, rgba(242,196,194,0.45), transparent 60%)",
              }}
            >
              <div className="leading-none">
                <p className="font-serif text-2xl font-bold text-white sm:text-3xl">New</p>
                <p className="mt-1 font-serif text-2xl font-bold text-blush sm:text-3xl">Season</p>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-cream/80">
                  Collection
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
