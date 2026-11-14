import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { demoTestimonials } from "@/lib/demo-data";
import { SectionLabel, StarRating } from "./ui-bits";
import { DemoBadge } from "./demo-badge";

function QuoteText({ quote, highlights }: { quote: string; highlights: string[] }) {
  let text = quote;
  const parts: React.ReactNode[] = [];
  highlights.forEach((h, idx) => {
    const i = text.indexOf(h);
    if (i === -1) return;
    parts.push(text.slice(0, i));
    parts.push(
      <strong key={idx} className="font-semibold text-forest">
        {h}
      </strong>,
    );
    text = text.slice(i + h.length);
  });
  parts.push(text);
  return <>{parts}</>;
}

export function Testimonials() {
  return (
    <section className="bg-cream py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="max-w-xl">
            <SectionLabel>Testimonials</SectionLabel>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <h2 className="font-sans text-2xl font-bold text-forest sm:text-3xl">
                What Our Customers Say
              </h2>
              <DemoBadge />
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              A preview of the reviews section for our customers.
            </p>
            <p className="mt-1 text-xs font-medium text-forest/70">
              Demonstration reviews shown for layout — not real customer feedback.
              Verified reviews will appear here once the review system is live.
            </p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-forest/20 text-forest hover:bg-forest/5"
              aria-label="Previous testimonials"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-forest/20 text-forest hover:bg-forest/5"
              aria-label="Next testimonials"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="no-scrollbar -mx-4 mt-7 flex gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0">
          {demoTestimonials.map((t) => (
            <div
              key={t.id}
              className="relative flex shrink-0 flex-col rounded-2xl border border-border bg-white p-5 sm:w-auto"
              style={{ width: "min(85vw, 360px)" }}
            >
              <button
                className="absolute right-4 top-4 inline-flex h-7 w-7 items-center justify-center rounded-full text-blush-dark hover:bg-blush/20"
                aria-label="Like review"
              >
                <Heart size={15} />
              </button>
              <div className="flex items-center gap-3 pr-8">
                <span className="relative inline-block h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-blush/40">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-forest">{t.name}</p>
                  <p className="text-[11px] text-muted-foreground">{t.country}</p>
                </div>
              </div>
              <StarRating rating={t.rating} className="mt-3" />
              <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                <QuoteText quote={t.quote} highlights={t.highlights} />
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
