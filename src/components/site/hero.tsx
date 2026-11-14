"use client";

import { ArrowRight, ChevronLeft, ChevronRight, Heart } from "lucide-react";

export function Hero() {
  return (
    <section id="home" className="bg-cream">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative grid overflow-hidden rounded-2xl lg:grid-cols-2">
          {/* Left: forest green text panel */}
          <div className="relative flex flex-col justify-center bg-forest px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
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
              <div className="mt-6">
                <a
                  href="#best-sellers"
                  className="inline-flex items-center gap-2 rounded-full bg-blush px-6 py-3 text-sm font-semibold text-forest transition-transform hover:scale-[1.03] hover:bg-blush-light"
                >
                  Shop Now
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </div>

          {/* Right: hero image */}
          <div className="relative min-h-[280px] overflow-hidden bg-forest sm:min-h-[340px] lg:min-h-[420px]">
            <img
              src="/images/hero-beauty.png"
              alt="Woman with radiant glowing skin holding a pink peony"
              className="absolute inset-0 h-full w-full object-cover object-center"
              loading="eager"
            />
            {/* gradient blend from green into the photo on the left edge */}
            <div
              className="pointer-events-none absolute inset-0 lg:bg-gradient-to-r lg:from-forest lg:via-forest/30 lg:to-transparent"
              aria-hidden="true"
            />
            {/* handwritten script accent — placed mid-hero over the image */}
            <div className="absolute left-1/2 top-[28%] -translate-x-1/2 rotate-[-4deg] text-center sm:left-[55%]">
              <p className="font-script text-3xl text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] sm:text-4xl">
                Glow Naturally
              </p>
              <p className="mt-1 text-blush">
                <Heart size={18} className="inline fill-blush drop-shadow" />
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
            <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
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
