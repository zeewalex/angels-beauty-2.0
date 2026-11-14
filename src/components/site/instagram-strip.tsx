import { Heart, ArrowRight, Instagram } from "lucide-react";
import { instagramImages } from "@/lib/demo-data";

export function InstagramStrip() {
  return (
    <section className="bg-cream py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="max-w-xl">
            <h2 className="flex items-center gap-2 font-serif text-2xl font-bold text-forest sm:text-3xl">
              <Instagram size={22} className="text-forest" />
              Follow Us on Instagram
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Get inspired. See real results. Join our beauty journey.
            </p>
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-1.5 rounded-full border border-forest/20 px-4 py-2 text-sm font-semibold text-forest hover:bg-forest/5"
          >
            Follow Us
            <ArrowRight size={15} />
          </a>
        </div>

        <div className="no-scrollbar -mx-4 mt-7 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-3 sm:overflow-visible sm:px-0">
          {instagramImages.map((src, i) => (
            <a
              key={src}
              href="#"
              className="group relative aspect-square shrink-0 overflow-hidden rounded-xl"
              style={{ width: "min(70vw, 200px)" }}
            >
              <img
                src={src}
                alt={`Angels Beauty on Instagram post ${i + 1}`}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-forest/0 opacity-0 transition-all group-hover:bg-forest/30 group-hover:opacity-100">
                <Instagram size={22} className="text-white" />
              </div>
              <span className="absolute left-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-blush-dark backdrop-blur">
                <Heart size={13} />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
