import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A small floating badge that marks sections built with temporary demo
 * content. This makes it visually clear which parts of the site are demo
 * data vs. real store data (per the Phase 1 brief). Will be removed once
 * the real Supabase / Cloudinary data is connected in Phase 3.
 */
export function DemoBadge({
  className,
  label = "Demo Content",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-dashed border-forest/30 bg-cream-dark/60 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-forest/70",
        className,
      )}
      title="This section uses temporary demo data — not connected to the real store yet."
    >
      <Sparkles size={11} className="text-blush-dark" />
      {label}
    </span>
  );
}
