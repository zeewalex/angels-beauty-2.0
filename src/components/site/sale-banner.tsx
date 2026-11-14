import { ArrowRight } from "lucide-react";
import { SectionLabel } from "./ui-bits";

export function SaleBanner() {
  return (
    <section className="bg-cream py-6 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center overflow-hidden rounded-2xl bg-blush lg:grid-cols-[1fr_1.3fr_1fr]">
          {/* image left */}
          <div className="relative hidden h-full min-h-[260px] overflow-hidden lg:block">
            <img
              src="/images/banner-sale.png"
              alt="Woman applying face cream"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>

          {/* center text */}
          <div className="px-6 py-9 text-center sm:px-10 sm:py-12">
            <div className="flex justify-center">
              <SectionLabel tone="green">Special Offer</SectionLabel>
            </div>
            <h2 className="mt-3 font-serif text-3xl font-bold text-forest sm:text-4xl">
              Glow Up This Season
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm text-forest/70">
              Get up to 40% OFF on selected skincare &amp; makeup products.
            </p>
            <div className="mt-5">
              <a
                href="#shop"
                className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-forest-light"
              >
                Shop Sale
                <ArrowRight size={15} />
              </a>
            </div>
          </div>

          {/* right splash */}
          <div className="relative flex min-h-[200px] items-center justify-center px-6 py-8 sm:min-h-[240px]">
            <div
              className="flex h-36 w-36 items-center justify-center rounded-full bg-forest/90 text-center sm:h-44 sm:w-44"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 30% 30%, rgba(247,217,220,0.6), transparent 60%)",
              }}
            >
              <div className="leading-none">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-blush">
                  Up to
                </p>
                <p className="font-serif text-5xl font-bold text-white sm:text-6xl">
                  40%
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-blush">
                  OFF
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
