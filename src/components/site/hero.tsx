"use client";

import { ArrowRight, ChevronLeft, ChevronRight, Heart } from "lucide-react";

export function Hero() {
  return (
    <section id="home" className="bg-cream">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative grid overflow-hidden rounded-2xl lg:grid-cols-2">
          {/* Left: forest green text panel */}
          <div className="relative flex flex-col justify-center bg-forest px-6 py-12 sm:px-10 sm:py-16 lg:px-14 lg:py-20">
            {/* soft leaf shadow decoration */}
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 15% 20%, rgba(242,196,194,0.25), transparent 40%), radial-gradient(circle at 85% 75%, rgba(45,106,79,0.6), transparent 45%)",
              }}
              aria-hidden="true"
            />
            <div className="relative max-w-md">
              <span className="inline-flex items-center rounded-full border border-white/30 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                Natural Beauty Care
              </span>
              <h1 className="mt-5 font-serif text-[34px] font-semibold leading-[1.08] text-white sm:text-[44px] lg:text-[52px]">
                Real Beauty
                <br />
                Starts With
                <br />
                <span className="text-blush">Healthy Skin</span>
              </h1>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream/80">
                Discover premium skincare, makeup and beauty essentials made
                for your natural glow. Because you deserve the best.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href="#best-sellers"
                  className="inline-flex items-center gap-2 rounded-full bg-blush px-6 py-3 text-sm font-semibold text-forest transition-transform hover:scale-[1.03] hover:bg-blush-light"
                >
                  Shop Now
                  <ArrowRight size={16} />
                </a>
                <a
                  href="#categories"
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Explore Categories
                </a>
              </div>

              {/* trust mini stats */}
              <div className="mt-9 flex items-center gap-6">
                <div>
                  <p className="font-serif text-2xl font-bold text-white">200K+</p>
                  <p className="text-[11px] uppercase tracking-wider text-cream/60">
                    Happy Customers
                  </p>
                </div>
                <div className="h-9 w-px bg-white/20" />
                <div>
                  <p className="font-serif text-2xl font-bold text-white">4.9★</p>
                  <p className="text-[11px] uppercase tracking-wider text-cream/60">
                    Avg Rating
                  </p>
                </div>
                <div className="h-9 w-px bg-white/20" />
                <div>
                  <p className="font-serif text-2xl font-bold text-white">100%</p>
                  <p className="text-[11px] uppercase tracking-wider text-cream/60">
                    Authentic
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: hero image */}
          <div className="relative min-h-[320px] overflow-hidden bg-forest sm:min-h-[420px] lg:min-h-[560px]">
            <img
              src="/images/hero-beauty.png"
              alt="Woman with radiant glowing skin holding a pink peony"
              className="h-full w-full object-cover object-center"
              loading="eager"
            />
            {/* gradient blend from green into the photo on the left edge */}
            <div
              className="pointer-events-none absolute inset-0 lg:bg-gradient-to-r lg:from-forest lg:via-forest/30 lg:to-transparent"
              aria-hidden="true"
            />
            {/* handwritten script accent */}
            <div className="absolute right-5 top-6 rotate-3 text-right">
              <p className="font-script text-2xl text-white drop-shadow sm:text-3xl">
                Glow Naturally
              </p>
              <p className="mt-0.5 text-center text-blush">
                <Heart size={16} className="inline fill-blush" />
              </p>
            </div>

            {/* carousel controls */}
            <div className="absolute bottom-5 right-5 flex items-center gap-2">
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 text-white backdrop-blur hover:bg-white/10"
                aria-label="Previous slide"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-forest hover:bg-blush"
                aria-label="Next slide"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* dots */}
            <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 lg:left-[45%]">
              <span className="h-1.5 w-6 rounded-full bg-white" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
