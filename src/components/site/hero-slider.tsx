"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

type Slide = {
  id: string;
  mediaType: string;
  desktopMedia: string;
  mobileMedia?: string | null;
  posterImage?: string | null;
  headline?: string | null;
  subtitle?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
};

export function HeroSlider({ slides }: { slides: Slide[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setReducedMotion(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, []);

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (paused || reducedMotion || slides.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [paused, reducedMotion, next, slides.length]);

  if (slides.length === 0) return null;
  const slide = slides[current];

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-forest"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-label="Homepage carousel"
    >
      {/* Media */}
      <div className="relative min-h-[300px] sm:min-h-[400px] lg:min-h-[480px]">
        {slide.mediaType === "video" ? (
          <video
            key={slide.id}
            src={slide.desktopMedia}
            poster={slide.posterImage || undefined}
            autoPlay={!reducedMotion}
            muted
            playsInline
            loop
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <img
            key={slide.id}
            src={slide.desktopMedia}
            alt={slide.headline || "Angels Beauty"}
            className="absolute inset-0 h-full w-full object-cover"
            priority={current === 0}
          />
        )}
        {/* Gradient overlay for text readability */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-forest via-forest/40 to-transparent" />
      </div>

      {/* Content overlay */}
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-md px-6 py-10 sm:px-10 sm:py-14 lg:px-14">
          {slide.headline && (
            <h1 className="font-serif text-[28px] font-semibold leading-tight text-white sm:text-[36px] lg:text-[44px]">
              {slide.headline}
            </h1>
          )}
          {slide.subtitle && (
            <p className="mt-3 text-sm leading-relaxed text-cream/80 sm:text-base">{slide.subtitle}</p>
          )}
          {slide.ctaText && slide.ctaUrl && (
            <a
              href={slide.ctaUrl}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-blush px-6 py-2.5 text-sm font-semibold text-forest transition-transform hover:scale-[1.03]"
            >
              {slide.ctaText}
              <ArrowRight size={15} />
            </a>
          )}
        </div>
      </div>

      {/* Controls */}
      {slides.length > 1 && (
        <>
          {/* Prev/Next */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            {paused && !reducedMotion && (
              <button onClick={() => setPaused(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/30" aria-label="Play">
                <Play size={16} />
              </button>
            )}
            {!paused && !reducedMotion && (
              <button onClick={() => setPaused(true)} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/30" aria-label="Pause">
                <Pause size={16} />
              </button>
            )}
            <button onClick={prev} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/30" aria-label="Previous slide">
              <ChevronLeft size={16} />
            </button>
            <button onClick={next} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-forest hover:bg-blush" aria-label="Next slide">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setCurrent(i)}
                className={cn("h-1.5 rounded-full transition-all", i === current ? "w-6 bg-white" : "w-1.5 bg-white/40")}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
