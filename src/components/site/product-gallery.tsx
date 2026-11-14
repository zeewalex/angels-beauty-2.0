"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const imgs = images.length > 0 ? images : ["/images/product-placeholder.svg"];

  return (
    <div className="flex flex-col gap-3">
      {/* main image */}
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-blush-tile">
        <img
          src={imgs[active]}
          alt={`${name} — image ${active + 1}`}
          className="h-full w-full object-cover"
          loading="eager"
        />
        {imgs.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-forest/80 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
            {active + 1} / {imgs.length}
          </span>
        )}
      </div>
      {/* thumbnails */}
      {imgs.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {imgs.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-blush-tile transition-colors sm:h-20 sm:w-20",
                active === i ? "border-forest" : "border-border hover:border-forest/40",
              )}
              aria-label={`View image ${i + 1}`}
            >
              <img src={src} alt={`${name} thumbnail ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
